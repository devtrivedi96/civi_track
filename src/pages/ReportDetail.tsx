import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  MessageCircle,
  Send,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle,
  Eye,
  UserCheck,
  Loader2,
} from "lucide-react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import {
  db,
  storage,
  Report,
  ReportComment,
  StatusHistory,
  Official,
} from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import { format } from "date-fns";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [report, setReport] = useState<Report | null>(null);
  const [comments, setComments] = useState<ReportComment[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mapPosition, setMapPosition] = useState<[number, number] | null>(null);
  const [officials, setOfficials] = useState<Official[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedOfficial, setSelectedOfficial] = useState("");

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Fetch report
    const fetchReport = async () => {
      try {
        const reportDoc = await getDoc(doc(db, "reports", id));
        if (reportDoc.exists()) {
          const data = reportDoc.data();

          // Process images
          if (data.images && Array.isArray(data.images)) {
            const urls = await Promise.all(
              data.images.map(async (image: { id: string; data: string }) => {
                if (image.data.startsWith("data:")) {
                  return image.data; // Already base64
                }
                try {
                  return await getDownloadURL(ref(storage, image.data));
                } catch (error) {
                  console.error("Error loading image:", error);
                  return null;
                }
              })
            );
            setImageUrls(urls.filter((url): url is string => url !== null));
          }

          // Set map position from location
          if (
            data.location &&
            data.location.latitude &&
            data.location.longitude
          ) {
            const lat = parseFloat(data.location.latitude);
            const lng = parseFloat(data.location.longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
              setMapPosition([lat, lng]);
            }
          }

          setReport({
            id: reportDoc.id,
            ...data,
            createdAt:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate()
                : new Date(data.createdAt),
            updatedAt:
              data.updatedAt instanceof Timestamp
                ? data.updatedAt.toDate()
                : new Date(data.updatedAt),
          } as Report);
        }
      } catch (error) {
        console.error("Error fetching report:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();

    // Set up real-time listeners for comments
    const commentsQuery = query(
      collection(db, "reportComments"),
      where("reportId", "==", id),
      orderBy("createdAt", "asc")
    );

    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
      const commentsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : new Date(data.createdAt),
        } as ReportComment;
      });
      setComments(commentsData);
    });

    // Set up real-time listeners for status history
    const statusQuery = query(
      collection(db, "statusHistory"),
      where("reportId", "==", id),
      orderBy("createdAt", "asc")
    );

    const unsubscribeStatus = onSnapshot(statusQuery, (snapshot) => {
      const statusData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : new Date(data.createdAt),
        } as StatusHistory;
      });
      setStatusHistory(statusData);
    });

    return () => {
      unsubscribeComments();
      unsubscribeStatus();
    };
  }, [id]);

  // Fetch officials
  useEffect(() => {
    const fetchOfficials = async () => {
      const officialsQuery = query(
        collection(db, "officials"),
        where("status", "==", "active"),
        orderBy("dateAdded", "desc")
      );

      const unsubscribe = onSnapshot(officialsQuery, (snapshot) => {
        const officialsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          dateAdded: doc.data().dateAdded?.toDate() || new Date(),
        })) as Official[];
        setOfficials(officialsData);
      });

      return unsubscribe;
    };

    const unsubscribe = fetchOfficials();
    return () => {
      unsubscribe.then((unsub) => unsub());
    };
  }, []);

  // Handle department and official selection
  const handleDepartmentChange = (dept: string) => {
    setSelectedDepartment(dept);
    setSelectedOfficial(""); // Reset official when department changes
  };

  const handleOfficialAssignment = async () => {
    if (!selectedOfficial || !selectedDepartment || !report) return;

    try {
      // Update report with assignment details
      await updateDoc(doc(db, "reports", report.id), {
        status: "assigned",
        department: selectedDepartment,
        assignedOfficialId: selectedOfficial,
        assignedAt: new Date(),
      });

      // Add status history entry
      await addDoc(collection(db, "statusHistory"), {
        reportId: report.id,
        status: "assigned",
        changedBy: user?.uid || "",
        notes: `Assigned to department: ${selectedDepartment}`,
        createdAt: new Date(),
      });

      // Add a system comment about the assignment
      await addDoc(collection(db, "reportComments"), {
        reportId: report.id,
        userId: "system",
        userDisplayName: "System",
        comment: `Report assigned to ${selectedDepartment} department`,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Error assigning report:", error);
      alert("Failed to assign report. Please try again.");
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || !id) {
      alert("Please write a comment before submitting");
      return;
    }

    setSubmittingComment(true);

    try {
      const commentData = {
        reportId: id,
        userId: user.uid,
        userEmail: user.email,
        userDisplayName: user.displayName || "Anonymous",
        comment: newComment.trim(),
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "reportComments"), commentData);
      setNewComment("");
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("Error submitting comment. Please try again.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      submitted: Clock,
      verified: Eye,
      assigned: UserCheck,
      resolved: CheckCircle,
    };
    return icons[status as keyof typeof icons] || AlertCircle;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      submitted: "bg-slate-600 dark:bg-slate-500",
      verified: "bg-blue-600 dark:bg-blue-500",
      assigned: "bg-amber-600 dark:bg-amber-500",
      resolved: "bg-emerald-600 dark:bg-emerald-500",
    };
    return colors[status as keyof typeof colors] || "bg-slate-600";
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: "text-emerald-700 bg-emerald-100 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700",
      medium:
        "text-amber-700 bg-amber-100 border-amber-200 dark:text-amber-300 dark:bg-amber-900/30 dark:border-amber-700",
      high: "text-orange-700 bg-orange-100 border-orange-200 dark:text-orange-300 dark:bg-orange-900/30 dark:border-orange-700",
      critical:
        "text-red-700 bg-red-100 border-red-200 dark:text-red-300 dark:bg-red-900/30 dark:border-red-700",
    };
    return (
      colors[severity as keyof typeof colors] ||
      "text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-600"
    );
  };

  const nextImage = () => {
    if (report?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % report.images.length);
    }
  };

  const prevImage = () => {
    if (report?.images) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + report.images.length) % report.images.length
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Report not found
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            The report you're looking for doesn't exist or may have been
            removed.
          </p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4 sm:mb-6 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-3 break-words">
                  {report.title}
                </h1>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span className="truncate">
                      {format(report.createdAt, "MMM dd, yyyy HH:mm")}
                    </span>
                  </div>

                  {report.address && (
                    <div className="flex items-center min-w-0">
                      <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                      <span className="truncate">{report.address}</span>
                    </div>
                  )}

                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span className="capitalize">{report.category}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium text-white ${getStatusColor(
                    report.status
                  )}`}
                >
                  {(() => {
                    const StatusIcon = getStatusIcon(report.status);
                    return <StatusIcon className="w-3 h-3 mr-1" />;
                  })()}
                  {report.status.charAt(0).toUpperCase() +
                    report.status.slice(1)}
                </span>

                <span
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border capitalize ${getSeverityColor(
                    report.severity
                  )}`}
                >
                  {report.severity}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assignment Section (Only visible to admins) */}
          {(profile?.role === "admin" || profile?.role === "agent") &&
            report.status !== "resolved" && (
              <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border p-4 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Assign to Department
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Department</option>
                      {Array.from(
                        new Set(officials.map((o) => o.department))
                      ).map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Official
                    </label>
                    <select
                      value={selectedOfficial}
                      onChange={(e) => setSelectedOfficial(e.target.value)}
                      disabled={!selectedDepartment}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    >
                      <option value="">Select Official</option>
                      {officials
                        .filter((o) => o.department === selectedDepartment)
                        .map((official) => (
                          <option key={official.id} value={official.id}>
                            {official.email} ({official.jurisdiction})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleOfficialAssignment}
                    disabled={!selectedDepartment || !selectedOfficial}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Assign Report
                  </button>
                </div>
              </div>
            )}

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            {imageUrls.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Photos ({imageUrls.length})
                  </h2>
                </div>

                <div className="p-4 sm:p-6">
                  <div className="relative group">
                    <img
                      src={imageUrls[currentImageIndex]}
                      alt={`Report image ${currentImageIndex + 1}`}
                      className="w-full h-64 sm:h-80 lg:h-96 object-cover rounded-lg cursor-pointer transition-transform hover:scale-[1.02]"
                      onClick={() => setIsImageModalOpen(true)}
                    />

                    {imageUrls.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>

                        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
                          {currentImageIndex + 1} / {imageUrls.length}
                        </div>
                      </>
                    )}
                  </div>

                  {imageUrls.length > 1 && (
                    <div className="flex space-x-2 sm:space-x-3 mt-4 overflow-x-auto py-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                      {imageUrls.map((url, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden transition-all
                            ${
                              index === currentImageIndex
                                ? "ring-2 ring-blue-500 dark:ring-blue-400 scale-105"
                                : "ring-1 ring-slate-200 dark:ring-slate-600 hover:ring-slate-300 dark:hover:ring-slate-500"
                            }`}
                        >
                          <img
                            src={url}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {index === currentImageIndex && (
                            <div className="absolute inset-0 bg-blue-500/10" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Description
                </h2>
              </div>
              <div className="p-4 sm:p-6">
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {report.description}
                </p>
              </div>
            </div>

            {/* Map */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Location
                </h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="h-64 sm:h-80 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
                  <MapContainer
                    center={mapPosition || [20.5937, 78.9629]}
                    zoom={mapPosition ? 15 : 5}
                    style={{ height: "100%", width: "100%" }}
                    minZoom={3}
                    maxZoom={18}
                    maxBounds={[
                      [6.4626999, 68.1097],
                      [35.5141, 97.39535799999999],
                    ]}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {mapPosition && (
                      <Marker position={mapPosition}>
                        <Popup>
                          <div className="text-center">
                            <h3 className="font-medium mb-1">
                              Report Location
                            </h3>
                            <p className="text-sm text-gray-600">
                              {report.address ||
                                `${mapPosition[0].toFixed(
                                  6
                                )}, ${mapPosition[1].toFixed(6)}`}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </div>
                {report.address && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 flex items-center">
                    <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                    {report.address}
                  </p>
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Comments ({comments.length})
                </h2>
              </div>

              <div className="p-4 sm:p-6">
                {/* Comment Form */}
                {user && (
                  <form onSubmit={handleSubmitComment} className="mb-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment..."
                          rows={3}
                          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!newComment.trim() || submittingComment}
                        className="self-start sm:self-end bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:bg-blue-500 dark:hover:bg-blue-600 dark:disabled:bg-blue-400 text-white px-4 py-3 rounded-lg flex items-center justify-center min-w-[100px] sm:min-w-[auto] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                      >
                        {submittingComment ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4 sm:mr-0" />
                            <span className="ml-2 sm:hidden">Submit</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                              <span className="font-medium text-slate-900 dark:text-white truncate">
                                {comment.userDisplayName || "Anonymous"}
                              </span>
                              <span className="text-sm text-slate-500 dark:text-slate-400 flex-shrink-0">
                                {format(
                                  comment.createdAt,
                                  "MMM dd, yyyy HH:mm"
                                )}
                              </span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 mt-2 break-words">
                              {comment.comment}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        <MessageCircle className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 font-medium">
                        No comments yet
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                        Be the first to comment on this report
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Timeline */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Status Timeline
                </h2>
              </div>

              <div className="p-4 sm:p-6">
                <div className="space-y-4">
                  {statusHistory.map((status, index) => {
                    const StatusIcon = getStatusIcon(status.status);
                    return (
                      <div
                        key={status.id}
                        className="flex items-start space-x-3"
                      >
                        <div className="flex-shrink-0 relative">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${getStatusColor(
                              status.status
                            )}`}
                          >
                            <StatusIcon className="w-4 h-4" />
                          </div>
                          {index < statusHistory.length - 1 && (
                            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-0.5 h-4 bg-slate-200 dark:bg-slate-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                            <span className="font-medium text-slate-900 dark:text-white capitalize">
                              {status.status}
                            </span>
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              {format(status.createdAt, "MMM dd, HH:mm")}
                            </span>
                          </div>
                          {status.notes && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 break-words">
                              {status.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Location Map */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Quick Location
                </h2>
              </div>
              <div className="p-4 sm:p-6">
                {mapPosition ? (
                  <div className="h-48 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
                    <MapContainer
                      center={mapPosition}
                      zoom={15}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <Marker position={mapPosition}>
                        <Popup>{report.address || "Report Location"}</Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                ) : (
                  <div className="h-48 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-600">
                    <div className="text-center">
                      <MapPin className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Location not available
                      </p>
                    </div>
                  </div>
                )}
                {report.address && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 break-words">
                    {report.address}
                  </p>
                )}
              </div>
            </div>

            {/* Report Details Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Report Details
                </h2>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Status
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(
                      report.status
                    )}`}
                  >
                    {(() => {
                      const StatusIcon = getStatusIcon(report.status);
                      return <StatusIcon className="w-3 h-3 mr-1" />;
                    })()}
                    {report.status.charAt(0).toUpperCase() +
                      report.status.slice(1)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Severity
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border capitalize ${getSeverityColor(
                      report.severity
                    )}`}
                  >
                    {report.severity}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Category
                  </span>
                  <span className="text-sm text-slate-900 dark:text-white font-medium capitalize">
                    {report.category}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Created
                  </span>
                  <span className="text-sm text-slate-900 dark:text-white">
                    {format(report.createdAt, "MMM dd, yyyy")}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Last Updated
                  </span>
                  <span className="text-sm text-slate-900 dark:text-white">
                    {format(report.updatedAt, "MMM dd, yyyy")}
                  </span>
                </div>

                {imageUrls.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Photos
                    </span>
                    <span className="text-sm text-slate-900 dark:text-white font-medium">
                      {imageUrls.length} image
                      {imageUrls.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Image Modal */}
        {isImageModalOpen && imageUrls.length > 0 && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setIsImageModalOpen(false)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={imageUrls[currentImageIndex]}
                alt={`Report image ${currentImageIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg"
              />

              <button
                onClick={() => setIsImageModalOpen(false)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {imageUrls.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>

                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium">
                    {currentImageIndex + 1} / {imageUrls.length}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
