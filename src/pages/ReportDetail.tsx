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
} from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import { format } from "date-fns";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [report, setReport] = useState<Report | null>(null);
  const [comments, setComments] = useState<ReportComment[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mapPosition, setMapPosition] = useState<[number, number] | null>(null);

  const [imageUrls, setImageUrls] = useState<string[]>([]);

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

  const getStatusColor = (status: string) => {
    const colors = {
      submitted: "bg-gray-500",
      verified: "bg-blue-500",
      assigned: "bg-yellow-500",
      resolved: "bg-green-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: "text-green-600 bg-green-50 border-green-200",
      medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
      high: "text-orange-600 bg-orange-50 border-orange-200",
      critical: "text-red-600 bg-red-50 border-red-200",
    };
    return (
      colors[severity as keyof typeof colors] ||
      "text-gray-600 bg-gray-50 border-gray-200"
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Report not found
          </h2>
          <p className="text-gray-600 mb-4">
            The report you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Go back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {report.title}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {format(report.createdAt, "MMM dd, yyyy HH:mm")}
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {report.address || "Location set"}
                </div>
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {report.category}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getStatusColor(
                  report.status
                )}`}
              >
                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
              </span>
              <span
                className={`px-3 py-1 rounded text-sm font-medium border capitalize ${getSeverityColor(
                  report.severity
                )}`}
              >
                {report.severity}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                <MapPin className="w-5 h-5 inline-block mr-2" />
                Location
              </h2>
              <div className="h-64 rounded-lg overflow-hidden">
                <MapContainer
                  center={mapPosition || [20.5937, 78.9629]} // Center of India
                  zoom={mapPosition ? 15 : 5} // Zoom out to show India if no specific location
                  style={{ height: "100%", width: "100%" }}
                  minZoom={3}
                  maxZoom={18}
                  maxBounds={[
                    [6.4626999, 68.1097],
                    [35.5141, 97.39535799999999],
                  ]} // India bounds
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {mapPosition && (
                    <Marker position={mapPosition}>
                      <Popup>
                        <div className="text-center">
                          <h3 className="font-medium mb-1">Report Location</h3>
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
                <p className="text-sm text-gray-600 mt-2">
                  <MapPin className="w-4 h-4 inline-block mr-1" />
                  {report.address}
                </p>
              )}
            </div>
            {/* Images */}
            {imageUrls.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Photos
                </h2>
                <div className="relative">
                  <img
                    src={imageUrls[currentImageIndex]}
                    alt={`Report image ${currentImageIndex + 1}`}
                    className="w-full h-64 object-cover rounded-lg"
                  />

                  {report.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                        {currentImageIndex + 1} / {report.images.length}
                      </div>
                    </>
                  )}
                </div>

                {imageUrls.length > 1 && (
                  <div className="flex space-x-2 mt-4 overflow-x-auto py-2">
                    {imageUrls.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden 
                          ${
                            index === currentImageIndex
                              ? "ring-2 ring-blue-500"
                              : "ring-1 ring-gray-200"
                          }`}
                      >
                        <img
                          src={url}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {index === currentImageIndex && (
                          <div className="absolute inset-0 bg-blue-500 bg-opacity-10" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Description
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {report.description}
              </p>
            </div>

            {/* Comments */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Comments ({comments.length})
              </h2>

              {/* Comment Form */}
              {user && (
                <form onSubmit={handleSubmitComment} className="mb-6">
                  <div className="flex space-x-3">
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!newComment.trim() || submittingComment}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md flex items-center"
                    >
                      <Send className="w-4 h-4" />
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
                      className="bg-gray-50 rounded-lg p-4 border border-gray-100"
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">
                              {comment.userDisplayName || "Anonymous"}
                            </span>
                            <span className="text-sm text-gray-500">
                              {format(comment.createdAt, "MMM dd, yyyy HH:mm")}
                            </span>
                          </div>
                          <p className="text-gray-700 mt-1">
                            {comment.comment}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No comments yet</p>
                    <p className="text-sm text-gray-400">
                      Be the first to comment on this report
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Timeline */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Status Timeline
              </h2>

              <div className="space-y-4">
                {statusHistory.map((status) => (
                  <div key={status.id} className="flex items-start space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full mt-1 ${getStatusColor(
                        status.status
                      )}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 capitalize">
                          {status.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {format(status.createdAt, "MMM dd")}
                        </span>
                      </div>
                      {status.notes && (
                        <p className="text-sm text-gray-600 mt-1">
                          {status.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Location Map */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Location
              </h2>
              {mapPosition ? (
                <div className="h-48 rounded-lg overflow-hidden">
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
                <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Location not available</p>
                </div>
              )}
              {report.address && (
                <p className="text-sm text-gray-600 mt-2">{report.address}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}