import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Filter,
  Search,
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Eye,
  User,
  Activity,
  Target,
  Award,
  X,
  BarChart3,
  Zap,
} from "lucide-react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db, Report } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import { ReportCard } from "../components/ReportCard";

export function MyReports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) return;

    // Set up real-time listener for user's reports
    const reportsQuery = query(
      collection(db, "reports"),
      where("userId", "==", user.uid),
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
  }, [user]);

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

  const handleCreateReport = () => {
    navigate("/report");
  };

  const clearFilters = () => {
    setFilter("all");
    setSearchQuery("");
  };

  // Calculate stats
  const stats = {
    total: reports.length,
    submitted: reports.filter((r) => r.status === "submitted").length,
    inProgress: reports.filter(
      (r) => r.status === "assigned" || r.status === "verified"
    ).length,
    resolved: reports.filter((r) => r.status === "resolved").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse space-y-6">
            {/* Header Skeleton */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl shadow-xl p-8 border border-slate-600">
              <div className="h-8 bg-slate-600 rounded-lg w-1/3 mb-4"></div>
              <div className="h-4 bg-slate-600 rounded-lg w-1/2"></div>
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl shadow-xl p-6 border border-slate-600"
                >
                  <div className="h-16 bg-slate-600 rounded-lg mb-4"></div>
                  <div className="h-4 bg-slate-600 rounded w-20"></div>
                </div>
              ))}
            </div>

            {/* Content Skeleton */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl shadow-xl border border-slate-600">
              <div className="p-6">
                <div className="h-12 bg-slate-600 rounded-lg mb-6"></div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-slate-600 rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl shadow-2xl border border-slate-600">
          <div className="p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                      My Reports
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                      <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                      <p className="text-xs sm:text-sm text-slate-400">
                        Track and manage your civic issue submissions
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreateReport}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                New Report
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="group bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="text-blue-100 text-sm font-semibold">
                  Total Reports
                </div>
                <div className="flex items-center gap-1 text-xs text-blue-200">
                  <Activity className="w-3 h-3" />
                  <span>Your contributions</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 group-hover:bg-white/20 transition-colors">
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-orange-500/20">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="text-3xl font-bold">{stats.submitted}</div>
                <div className="text-orange-100 text-sm font-semibold">
                  Pending Review
                </div>
                <div className="flex items-center gap-1 text-xs text-orange-200">
                  <Clock className="w-3 h-3" />
                  <span>Awaiting verification</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 group-hover:bg-white/20 transition-colors">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-yellow-500/20">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="text-3xl font-bold">{stats.inProgress}</div>
                <div className="text-yellow-100 text-sm font-semibold">
                  In Progress
                </div>
                <div className="flex items-center gap-1 text-xs text-yellow-200">
                  <Target className="w-3 h-3" />
                  <span>Being addressed</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 group-hover:bg-white/20 transition-colors">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-green-500/20">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="text-3xl font-bold">{stats.resolved}</div>
                <div className="text-green-100 text-sm font-semibold">
                  Resolved
                </div>
                <div className="flex items-center gap-1 text-xs text-green-200">
                  <Award className="w-3 h-3" />
                  <span>
                    {stats.total > 0
                      ? Math.round((stats.resolved / stats.total) * 100)
                      : 0}
                    % success rate
                  </span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 group-hover:bg-white/20 transition-colors">
                <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl shadow-2xl border border-slate-600">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search your reports by title, description, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-700/50 focus:bg-slate-700 backdrop-blur-sm text-sm placeholder-slate-400 text-white"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-12 pr-12 py-4 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-slate-700/50 focus:bg-slate-700 min-w-[180px] transition-all duration-200 text-white"
                >
                  <option value="all">All Status</option>
                  <option value="submitted">Submitted</option>
                  <option value="verified">Verified</option>
                  <option value="assigned">Assigned</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            {/* Active Filters Display */}
            {(filter !== "all" || searchQuery) && (
              <div className="mt-6 pt-4 border-t border-slate-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm text-slate-400 font-medium">
                      Active filters:
                    </span>
                    {filter !== "all" && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        Status: {filter}
                      </span>
                    )}
                    {searchQuery && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-400 border border-slate-500/30">
                        Search: "{searchQuery}"
                      </span>
                    )}
                  </div>
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors duration-200 font-medium border border-slate-600 hover:border-red-500/50"
                  >
                    <X className="w-4 h-4" />
                    Clear all
                  </button>
                </div>
              </div>
            )}

            {/* Results Count */}
            <div className="flex items-center justify-between text-sm text-slate-400 mt-4">
              <span className="font-medium">
                Showing {filteredReports.length} of {reports.length} reports
              </span>
              {filteredReports.length !== reports.length && (
                <button
                  onClick={clearFilters}
                  className="text-blue-400 hover:text-blue-300 font-semibold hover:underline transition-colors"
                >
                  Show all reports
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reports List or Empty State */}
        {filteredReports.length > 0 ? (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onClick={() => handleReportClick(report)}
              />
            ))}
          </div>
        ) : (
          /* Enhanced Empty State */
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl shadow-2xl border border-slate-600">
            <div className="text-center py-20 px-6">
              {reports.length === 0 ? (
                /* No reports at all */
                <>
                  <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg border border-slate-600">
                    <FileText className="w-10 h-10 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    No reports yet
                  </h3>
                  <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
                    Start making a difference in your community by reporting
                    civic issues. Your voice matters and helps improve local
                    infrastructure and services.
                  </p>
                  <div className="space-y-6">
                    <button
                      onClick={handleCreateReport}
                      className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Create Your First Report
                    </button>
                    <div className="text-sm text-slate-400">
                      <p className="mb-3 font-medium">
                        Examples of issues you can report:
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        <span className="px-3 py-1 bg-slate-700/50 border border-slate-600 rounded-full text-xs text-slate-300">
                          Road Damage
                        </span>
                        <span className="px-3 py-1 bg-slate-700/50 border border-slate-600 rounded-full text-xs text-slate-300">
                          Street Lighting
                        </span>
                        <span className="px-3 py-1 bg-slate-700/50 border border-slate-600 rounded-full text-xs text-slate-300">
                          Waste Management
                        </span>
                        <span className="px-3 py-1 bg-slate-700/50 border border-slate-600 rounded-full text-xs text-slate-300">
                          Public Safety
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* No results found for current filters */
                <>
                  <div className="bg-gradient-to-br from-slate-600/20 to-slate-700/20 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center border border-slate-600">
                    <Search className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    No reports found
                  </h3>
                  <p className="text-slate-400 mb-6">
                    No reports match your current search criteria. Try adjusting
                    your filters or search terms.
                  </p>
                  <div className="space-y-4">
                    <button
                      onClick={clearFilters}
                      className="inline-flex items-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-xl transition-all duration-200 border border-slate-600 hover:border-slate-500"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Show All Reports
                    </button>
                    <div className="text-sm text-slate-400">
                      You have {reports.length} total report
                      {reports.length !== 1 ? "s" : ""}
                    </div>
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
