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
  Zap,
  Activity,
  Users,
  Calendar,
  Star,
  Globe
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
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentLocation();

    // Handle window resize
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

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
      window.removeEventListener('resize', handleResize);
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
    const matchesCategory = selectedCategory === "all" || report.category === selectedCategory;
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
    console.log('Navigating to report form...'); // Debug log
    // Try different possible routes - adjust based on your app structure
    navigate('/report'); // or try '/new-report', '/create-report', '/submit-report'
  };

  const getUniqueCategories = useMemo(() => {
    const categories = reports.map(report => report.category);
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
        return <Clock className="w-5 h-5" />;
      case "verified":
        return <AlertCircle className="w-5 h-5" />;
      case "assigned":
        return <TrendingUp className="w-5 h-5" />;
      case "resolved":
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "verified":
        return "text-purple-400 bg-purple-500/10 border-purple-500/20";
      case "assigned":
        return "text-orange-400 bg-orange-500/10 border-orange-500/20";
      case "resolved":
        return "text-green-400 bg-green-500/10 border-green-500/20";
      default:
        return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            {/* Header Skeleton */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl shadow-xl p-8 border border-slate-600">
              <div className="h-8 bg-slate-600 rounded-lg w-1/4 mb-8"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 bg-slate-600 rounded-xl"></div>
                ))}
              </div>
            </div>
            
            {/* Content Skeleton */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl shadow-xl border border-slate-600">
              <div className="h-96 bg-slate-600 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl shadow-2xl border border-slate-600">
          <div className="p-6 lg:p-8">
            {/* Title and View Toggle */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white">
                      Dashboard
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                      <Globe className="w-4 h-4 text-slate-400" />
                      <p className="text-slate-400">
                        Monitor and manage community reports
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center lg:justify-end gap-4">
                {/* View Toggle */}
                <div className="flex items-center bg-slate-700/50 backdrop-blur-sm rounded-xl p-1.5 shadow-inner border border-slate-600">
                  <button
                    onClick={() => setView("map")}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      view === "map"
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                        : "text-slate-300 hover:text-white hover:bg-slate-600/50"
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Map</span>
                  </button>
                  <button
                    onClick={() => setView("list")}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      view === "list"
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                        : "text-slate-300 hover:text-white hover:bg-slate-600/50"
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
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <Plus className="w-4 h-4" />
                    New Report
                  </button>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
              <div className="group bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-blue-500/20">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">
                      {reports.length}
                    </div>
                    <div className="text-blue-100 text-sm font-semibold">Total Reports</div>
                    <div className="flex items-center gap-1 text-xs text-blue-200">
                      <TrendingUp className="w-3 h-3" />
                      <span>Active community</span>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 group-hover:bg-white/20 transition-colors">
                    <BarChart3 className="w-8 h-8" />
                  </div>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-purple-500/20">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">
                      {reports.filter((r) => r.status === "submitted").length}
                    </div>
                    <div className="text-purple-100 text-sm font-semibold">New</div>
                    <div className="flex items-center gap-1 text-xs text-purple-200">
                      <Zap className="w-3 h-3" />
                      <span>Needs attention</span>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 group-hover:bg-white/20 transition-colors">
                    <Clock className="w-8 h-8" />
                  </div>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-orange-500/20">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">
                      {reports.filter((r) => r.status === "assigned").length}
                    </div>
                    <div className="text-orange-100 text-sm font-semibold">In Progress</div>
                    <div className="flex items-center gap-1 text-xs text-orange-200">
                      <Users className="w-3 h-3" />
                      <span>Being resolved</span>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 group-hover:bg-white/20 transition-colors">
                    <TrendingUp className="w-8 h-8" />
                  </div>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-green-500/20">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">
                      {reports.filter((r) => r.status === "resolved").length}
                    </div>
                    <div className="text-green-100 text-sm font-semibold">Resolved</div>
                    <div className="flex items-center gap-1 text-xs text-green-200">
                      <Star className="w-3 h-3" />
                      <span>Success stories</span>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 group-hover:bg-white/20 transition-colors">
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
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search reports by title, description, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-700/50 focus:bg-slate-700 backdrop-blur-sm text-sm placeholder-slate-400 text-white"
                  />
                </div>

                {/* Filter Toggle */}
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center justify-center gap-3 px-6 py-4 border border-slate-600 rounded-xl hover:bg-slate-700/50 transition-all duration-200 bg-slate-700/30 backdrop-blur-sm text-sm font-semibold min-w-[120px] text-slate-300 hover:text-white"
                >
                  <Filter className="w-5 h-5" />
                  <span>Filters</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Filter Panel */}
              {isFilterOpen && (
                <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-600 shadow-inner">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Status Filter */}
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-slate-200 mb-3">
                        Status
                      </label>
                      <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700 shadow-sm text-white"
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
                      <label className="block text-sm font-semibold text-slate-200 mb-3">
                        Category
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700 shadow-sm text-white"
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
                        className="flex items-center gap-2 px-6 py-3 text-slate-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors duration-200 font-semibold border border-slate-600 hover:border-red-500/50"
                      >
                        <X className="w-4 h-4" />
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Active Filters */}
                  {(filter !== "all" || selectedCategory !== "all" || searchQuery) && (
                    <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-slate-600">
                      {filter !== "all" && (
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border shadow-sm ${getStatusColor(filter)}`}>
                          {getStatusIcon(filter)}
                          Status: {filter}
                        </span>
                      )}
                      {selectedCategory !== "all" && (
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 shadow-sm">
                          Category: {selectedCategory}
                        </span>
                      )}
                      {searchQuery && (
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-slate-400 bg-slate-500/10 border border-slate-500/20 shadow-sm">
                          Search: "{searchQuery}"
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Results Count */}
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span className="font-semibold">
                  Showing {filteredReports.length} of {reports.length} reports
                </span>
                {filteredReports.length !== reports.length && (
                  <button
                    onClick={clearFilters}
                    className="text-blue-400 hover:text-blue-300 font-semibold hover:underline transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl shadow-2xl border border-slate-600 overflow-hidden">
          {view === "map" ? (
            <div className="relative">
              <div className="h-[500px] lg:h-[500px]">
                <MapView
                  reports={filteredReports}
                  center={userLocation}
                  onReportClick={handleReportClick}
                />
              </div>
              
              {/* Floating Add Report Button for Map View - Positioned above map */}
              <div className="absolute top-4 right-4 z-[1000]">
                <button 
                  onClick={handleNewReport}
                  className="bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white p-3 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 group hover:scale-110"
                  title="Add New Report"
                >
                  <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
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
                  <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg border border-slate-600">
                    <MapPin className="w-10 h-10 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    No reports found
                  </h3>
                  <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
                    {searchQuery || filter !== "all" || selectedCategory !== "all"
                      ? "Try adjusting your filters or search terms to find what you're looking for."
                      : "Be the first to report an issue in your community and help make a difference."}
                  </p>
                  {(searchQuery || filter !== "all" || selectedCategory !== "all") ? (
                    <button
                      onClick={clearFilters}
                      className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white px-8 py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl hover:scale-105"
                    >
                      Clear Filters
                    </button>
                  ) : (
                    <button
                      onClick={handleNewReport}
                      className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white px-8 py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl hover:scale-105"
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