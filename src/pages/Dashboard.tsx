import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, List, Filter, Search } from "lucide-react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  Timestamp,
} from "firebase/firestore";
import { db, Report } from "../lib/firebase";
import { MapView, DEFAULT_CENTER, INDIA_BOUNDS } from "../components/MapView";
import { ReportCard } from "../components/ReportCard";

export function Dashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"map" | "list">("map");
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] =
    useState<[number, number]>(DEFAULT_CENTER); // Default to center of India
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentLocation();

    // Set up real-time listener for reports
    const reportsQuery = query(
      collection(db, "reports"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
      const reportsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : new Date(data.createdAt),
          updatedAt:
            data.updatedAt instanceof Timestamp
              ? data.updatedAt.toDate()
              : new Date(data.updatedAt),
        } as Report;
      });

      setReports(reportsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // Check if location is within India's bounds
          const isWithinBounds =
            lat >= INDIA_BOUNDS.southWest.lat &&
            lat <= INDIA_BOUNDS.northEast.lat &&
            lng >= INDIA_BOUNDS.southWest.lng &&
            lng <= INDIA_BOUNDS.northEast.lng;

          // If within bounds, use user's location, otherwise use default center
          setUserLocation(isWithinBounds ? [lat, lng] : DEFAULT_CENTER);
        },
        (error) => {
          console.error("Error getting location:", error);
          setUserLocation(DEFAULT_CENTER); // Use default center on error
        }
      );
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesFilter = filter === "all" || report.status === filter;
    const matchesSearch =
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleReportClick = (report: Report) => {
    navigate(`/report/${report.id}`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex-none">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setView("map")}
              className={`p-2 rounded-lg ${
                view === "map"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <MapPin className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2 rounded-lg ${
                view === "list"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="verified">Verified</option>
              <option value="assigned">Assigned</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">
              {reports.length}
            </div>
            <div className="text-sm text-gray-600">Total Reports</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-600">
              {reports.filter((r) => r.status === "submitted").length}
            </div>
            <div className="text-sm text-gray-600">New</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-yellow-600">
              {reports.filter((r) => r.status === "assigned").length}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-600">
              {reports.filter((r) => r.status === "resolved").length}
            </div>
            <div className="text-sm text-gray-600">Resolved</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === "map" ? (
          <MapView
            reports={filteredReports}
            center={userLocation}
            onReportClick={handleReportClick}
          />
        ) : (
          <div className="h-full overflow-y-auto p-4">
            <div className="space-y-4 max-w-4xl mx-auto">
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onClick={() => handleReportClick(report)}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No reports found
                  </h3>
                  <p className="text-gray-600">
                    {searchQuery || filter !== "all"
                      ? "Try adjusting your filters or search terms."
                      : "Be the first to report an issue in your community."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
