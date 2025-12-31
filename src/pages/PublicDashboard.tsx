import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { MapView } from "../components/MapView";
import { AlertCircle, MapPin, Clock, CheckCircle, Loader } from "lucide-react";

export function PublicDashboard() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const q = query(
          collection(db, "reports"),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const fetchedReports = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const sanitized = fetchedReports.map((r: any) => {
          const createdAt =
            r.createdAt && typeof r.createdAt.toDate === "function"
              ? r.createdAt.toDate()
              : r.createdAt
              ? new Date(r.createdAt)
              : new Date();
          return {
            id: r.id,
            title: r.title,
            description: r.description,
            category: r.category,
            severity: r.severity || "low",
            status: r.status || "submitted",
            latitude: r.latitude,
            longitude: r.longitude,
            address: r.address,
            thumbnail: r.thumbnail || null,
            createdAt,
          };
        });
        setReports(sanitized);
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "resolved":
        return {
          bg: "bg-emerald-50",
          text: "text-emerald-700",
          border: "border-emerald-200",
          icon: CheckCircle,
        };
      case "in-progress":
        return {
          bg: "bg-amber-50",
          text: "text-amber-700",
          border: "border-amber-200",
          icon: Loader,
        };
      default:
        return {
          bg: "bg-rose-50",
          text: "text-rose-700",
          border: "border-rose-200",
          icon: AlertCircle,
        };
    }
  };

  const filteredReports = showResolved
    ? reports
    : reports.filter((r) => r.status !== "resolved");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-lg text-gray-600 font-medium">
            Loading reports...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Welcome to CiviTrack
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Help improve your community by reporting civic issues. Together,
              we can make a difference.
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center px-8 py-3 rounded-full text-lg font-semibold text-blue-600 bg-white hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <AlertCircle className="w-5 h-5 mr-2" />
              Sign In to Report Issues
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {reports.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Reports</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-600">
              {reports.filter((r) => r.status === "in-progress").length}
            </div>
            <div className="text-sm text-gray-600 mt-1">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600">
              {reports.filter((r) => r.status === "resolved").length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Resolved</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Recent Reports
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Browse and track community issues in real-time
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">
                  Show resolved:
                </span>
                <button
                  onClick={() => setShowResolved((s) => !s)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    showResolved ? "bg-blue-600" : "bg-gray-300"
                  }`}
                  aria-pressed={showResolved}
                  role="switch"
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                      showResolved ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="p-8 bg-gray-50">
            <div className="h-96 rounded-xl overflow-hidden shadow-lg border border-gray-200">
              <MapView
                reports={filteredReports}
                hideResolved={!showResolved}
                onReportClick={(r) => navigate(`/public/report/${r.id}`)}
              />
            </div>
          </div>

          {/* Reports List */}
          <div className="p-8">
            <div className="space-y-4">
              {filteredReports.map((report: any) => {
                const statusConfig = getStatusConfig(report.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <div
                    key={report.id}
                    className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-300 cursor-pointer"
                    onClick={() => navigate(`/public/report/${report.id}`)}
                  >
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      {/* Thumbnail */}
                      {report.thumbnail && (
                        <div className="flex-shrink-0">
                          <img
                            src={report.thumbnail}
                            alt={report.title}
                            className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200 group-hover:border-blue-400 transition-colors"
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {report.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {report.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center text-gray-500">
                            <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />
                            <span className="truncate max-w-xs">
                              {report.address}
                            </span>
                          </div>
                          <div className="flex items-center text-gray-500">
                            <Clock className="w-4 h-4 mr-1.5 flex-shrink-0" />
                            <span>
                              {report.createdAt instanceof Date
                                ? report.createdAt.toLocaleDateString()
                                : new Date(
                                    report.createdAt
                                  ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex-shrink-0">
                        <span
                          className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                        >
                          <StatusIcon className="w-4 h-4 mr-2" />
                          {report.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredReports.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">
                  No reports found
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  {showResolved
                    ? "There are no reports to display"
                    : "Try enabling resolved reports"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
