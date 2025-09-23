import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  List,
  Filter,
  Search,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  ChevronDown,
  X,
  BarChart3,
} from "lucide-react";
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
    useState<[number, number]>(DEFAULT_CENTER);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentLocation();

    // Handle window resize
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

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

    return () => {
      unsubscribe();
      window.removeEventListener("resize", handleResize);
    };
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
          setUserLocation(DEFAULT_CENTER);
        }
      );
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesFilter = filter === "all" || report.status === filter;
    const matchesCategory =
      selectedCategory === "all" || report.category === selectedCategory;
    const matchesSearch =
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesCategory && matchesSearch;
  });

  const handleReportClick = (report: Report) => {
    navigate(`/report/${report.id}`);
  };

  const handleNewReport = () => {
    navigate("/report"); // Navigate to the report form route
  };

  const getUniqueCategories = useMemo(() => {
    const categories = reports.map((report) => report.category);
    return [...new Set(categories)];
  }, [reports]);

  const clearFilters = () => {
    setFilter("all");
    setSelectedCategory("all");
    setSearchQuery("");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted":
        return <Clock className="w-4 h-4" />;
      case "verified":
        return <AlertCircle className="w-4 h-4" />;
      case "assigned":
        return <TrendingUp className="w-4 h-4" />;
      case "resolved":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "verified":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "assigned":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "resolved":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse space-y-6">
            {/* Header Skeleton */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-8 border border-white/50">
              <div className="h-8 bg-gray-200 rounded-lg w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-gray-100 rounded-xl"></div>
                ))}
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50">
              <div className="h-96 bg-gray-100 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Header Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/60">
          <div className="p-6 lg:p-8">
            {/* Title and View Toggle */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              <div className="space-y-1">
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                  Dashboard
                </h1>
                <p className="text-gray-600">
                  Monitor and manage community reports
                </p>
              </div>

              <div className="flex items-center justify-center lg:justify-end gap-4">
                {/* View Toggle */}
                <div className="flex items-center bg-gray-100/80 backdrop-blur-sm rounded-xl p-1.5 shadow-inner">
                  <button
                    onClick={() => setView("map")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      view === "map"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Map</span>
                  </button>
                  <button
                    onClick={() => setView("list")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      view === "list"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                    }`}
                  >
                    <List className="w-4 h-4" />
                    <span>List</span>
                  </button>
                </div>

                {/* Add Report Button - Show conditionally */}
                {(view === "list" || windowWidth >= 1024) && (
                  <button
                    onClick={handleNewReport}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <Plus className="w-4 h-4" />
                    New Report
                  </button>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-3xl font-bold">{reports.length}</div>
                    <div className="text-blue-100 text-sm font-medium">
                      Total Reports
                    </div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <BarChart3 className="w-8 h-8" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-3xl font-bold">
                      {reports.filter((r) => r.status === "submitted").length}
                    </div>
                    <div className="text-purple-100 text-sm font-medium">
                      New
                    </div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <Clock className="w-8 h-8" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-3xl font-bold">
                      {reports.filter((r) => r.status === "assigned").length}
                    </div>
                    <div className="text-orange-100 text-sm font-medium">
                      In Progress
                    </div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <TrendingUp className="w-8 h-8" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-3xl font-bold">
                      {reports.filter((r) => r.status === "resolved").length}
                    </div>
                    <div className="text-green-100 text-sm font-medium">
                      Resolved
                    </div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search reports by title, description, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70 focus:bg-white backdrop-blur-sm text-sm placeholder-gray-500"
                  />
                </div>

                {/* Filter Toggle */}
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center justify-center gap-3 px-6 py-4 border border-gray-200/60 rounded-xl hover:bg-white/70 transition-all duration-200 bg-white/50 backdrop-blur-sm text-sm font-medium min-w-[120px]"
                >
                  <Filter className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">Filters</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                      isFilterOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Filter Panel */}
              {isFilterOpen && (
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200/60 shadow-inner">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Status Filter */}
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Status
                      </label>
                      <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                      >
                        <option value="all">All Status</option>
                        <option value="submitted">Submitted</option>
                        <option value="verified">Verified</option>
                        <option value="assigned">Assigned</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>

                    {/* Category Filter */}
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Category
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                      >
                        <option value="all">All Categories</option>
                        {getUniqueCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Clear Filters */}
                    <div className="flex items-end">
                      <button
                        onClick={clearFilters}
                        className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 font-medium"
                      >
                        <X className="w-4 h-4" />
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Active Filters */}
                  {(filter !== "all" ||
                    selectedCategory !== "all" ||
                    searchQuery) && (
                    <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-200/60">
                      {filter !== "all" && (
                        <span
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border shadow-sm ${getStatusColor(
                            filter
                          )}`}
                        >
                          {getStatusIcon(filter)}
                          Status: {filter}
                        </span>
                      )}
                      {selectedCategory !== "all" && (
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 shadow-sm">
                          Category: {selectedCategory}
                        </span>
                      )}
                      {searchQuery && (
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-gray-600 bg-gray-100 border border-gray-200 shadow-sm">
                          Search: "{searchQuery}"
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Results Count */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span className="font-medium">
                  Showing {filteredReports.length} of {reports.length} reports
                </span>
                {filteredReports.length !== reports.length && (
                  <button
                    onClick={clearFilters}
                    className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/60 overflow-hidden">
          {view === "map" ? (
            <div className="h-[500px] lg:h-[700px] relative">
              <MapView
                reports={filteredReports}
                center={userLocation}
                onReportClick={handleReportClick}
              />

              {/* Floating Add Report Button for Map View */}
              <div className="absolute top-6 right-6 z-10">
                <button
                  onClick={handleNewReport}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 group hover:scale-110"
                  title="Add New Report"
                >
                  <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 lg:p-8">
              {filteredReports.length > 0 ? (
                <div className="space-y-6">
                  {filteredReports.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      onClick={() => handleReportClick(report)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg">
                    <MapPin className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    No reports found
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                    {searchQuery ||
                    filter !== "all" ||
                    selectedCategory !== "all"
                      ? "Try adjusting your filters or search terms to find what you're looking for."
                      : "Be the first to report an issue in your community and help make a difference."}
                  </p>
                  {searchQuery ||
                  filter !== "all" ||
                  selectedCategory !== "all" ? (
                    <button
                      onClick={clearFilters}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl hover:scale-105"
                    >
                      Clear Filters
                    </button>
                  ) : (
                    <button
                      onClick={handleNewReport}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl hover:scale-105"
                    >
                      Report an Issue
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
