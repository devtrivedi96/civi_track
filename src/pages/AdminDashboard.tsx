import { useState, useEffect } from "react";
import {
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Filter,
  Search,
  UserCheck,
  X,
  Calendar,
  TrendingUp,
  Activity,
  Bell,
  Building2,
  Mail,
  Shield,
} from "lucide-react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  where,
  Timestamp,
} from "firebase/firestore";
import { db, Report, Profile } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import { normalizeDepartmentName } from "../utils/departmentUtils";
import { DEPARTMENT_OFFICIALS } from "../utils/officialConfig";
import { CATEGORIES, getCategoriesForDepartment } from "../utils/departments";
import { gamificationService } from "../services/gamificationService";

interface DepartmentSpecificStats {
  todayNew: number;
  weekPending: number;
}

interface DashboardStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  critical: number;
  responseTime: number;
  departmentSpecific?: DepartmentSpecificStats;
}

export function AdminDashboard() {
  const { user, profile } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [updating, setUpdating] = useState(false);
  const [dateRange, setDateRange] = useState<"all" | "week" | "month">("all");
  const [activeTab, setActiveTab] = useState<"reports" | "officials">(
    "reports"
  );

  const isOfficial = profile?.role === "official";

  // Custom title based on role and department
  const dashboardTitle = isOfficial
    ? `${profile.department} Dashboard`
    : "Administrative Dashboard";

  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    critical: 0,
    responseTime: 0,
  });

  useEffect(() => {
    // Debug logging
    console.log("Current user:", user?.email);
    console.log("Current profile:", profile);
  }, [user, profile]);

  useEffect(() => {
    if (!profile) return;

    // Create query based on user role
    let reportsQuery;

    if (profile?.role === "official" && profile.department) {
      // Normalize department name to match collection naming
      const normalizedDept = normalizeDepartmentName(profile.department);

      // Use department-mirrored collection for officials
      reportsQuery = query(
        collection(db, "department_reports", normalizedDept, "reports"),
        orderBy("createdAt", "desc")
      );
    } else {
      // Admin sees all reports
      reportsQuery = query(
        collection(db, "reports"),
        orderBy("createdAt", "desc")
      );
    }

    const unsubscribeReports = onSnapshot(
      reportsQuery,
      (snapshot) => {
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

        // Calculate dashboard stats
        const newStats: DashboardStats = {
          total: reportsData.length,
          pending: reportsData.filter((r) => r.status === "submitted").length,
          inProgress: reportsData.filter(
            (r) => r.status === "assigned" || r.status === "verified"
          ).length,
          resolved: reportsData.filter((r) => r.status === "resolved").length,
          critical: reportsData.filter((r) => r.severity === "critical").length,
          responseTime: calculateAverageResponseTime(reportsData),
          // Add department-specific stats for officials
          departmentSpecific:
            profile?.role === "official"
              ? {
                  todayNew: reportsData.filter(
                    (r) =>
                      r.status === "submitted" &&
                      r.createdAt.toDateString() === new Date().toDateString()
                  ).length,
                  weekPending: reportsData.filter(
                    (r) =>
                      r.status !== "resolved" &&
                      Date.now() - r.createdAt.getTime() <=
                        7 * 24 * 60 * 60 * 1000
                  ).length,
                }
              : undefined,
        };

        setStats(newStats);
        setLoading(false);
      },
      (err) => {
        console.error("AdminDashboard reports onSnapshot error:", err);
        setReports([]);
        setLoading(false);
      }
    );

    // Set up real-time listener for profiles (agents)
    const profilesQuery = query(
      collection(db, "profiles"),
      where("role", "in", ["agent", "admin"])
    );

    const unsubscribeProfiles = onSnapshot(
      profilesQuery,
      (snapshot) => {
        const profilesData = snapshot.docs.map((doc) => {
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
          } as Profile;
        });

        setProfiles(profilesData);
      },
      (err) => {
        console.error("AdminDashboard profiles onSnapshot error:", err);
        setProfiles([]);
      }
    );

    return () => {
      unsubscribeReports();
      unsubscribeProfiles();
    };
  }, [profile]);

  const calculateAverageResponseTime = (reports: Report[]): number => {
    const resolvedReports = reports.filter((r) => r.status === "resolved");
    if (resolvedReports.length === 0) return 0;

    const totalTime = resolvedReports.reduce((acc, report) => {
      const created = report.createdAt.getTime();
      const resolved = report.updatedAt.getTime();
      return acc + (resolved - created);
    }, 0);

    return Math.round(
      totalTime / (resolvedReports.length * 1000 * 60 * 60 * 24)
    ); // Average days
  };

  const getFilteredReports = () => {
    let filtered = [...reports];

    // Date range filter
    const now = new Date();
    if (dateRange === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((r) => r.createdAt >= weekAgo);
    } else if (dateRange === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((r) => r.createdAt >= monthAgo);
    }

    // Status filter
    if (filter !== "all") {
      filtered = filtered.filter((r) => r.status === filter);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const updateReportStatus = async (
    reportId: string,
    status: string,
    assignedTo?: string
  ) => {
    setUpdating(true);

    try {
      // Find the original report ID from the department collection
      const report = reports.find((r) => r.id === reportId);
      const originalReportId = (report as any)?.reportId || reportId;

      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      if (assignedTo) {
        updateData.assignedTo = assignedTo;
      }

      await updateDoc(doc(db, "reports", originalReportId), updateData);

      // Award gamification points for resolution
      if (status === "resolved" && user) {
        try {
          const reportData = reports.find((r) => r.id === reportId);
          if (reportData) {
            const resolutionTimeHours =
              (new Date().getTime() - reportData.createdAt.getTime()) /
              (1000 * 60 * 60);
            const isQuickResolution = resolutionTimeHours <= 24;
            await gamificationService.awardReportResolution(
              user.uid,
              resolutionTimeHours,
              isQuickResolution
            );
          }
        } catch (error) {
          console.error("Error awarding gamification points:", error);
          // Don't fail the status update if gamification fails
        }
      }

      // Add to status history
      // This would typically be done with a cloud function in production

      setSelectedReport(null);
    } catch (error) {
      console.error("Error updating report:", error);
      alert("Error updating report. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      submitted: "bg-slate-500",
      verified: "bg-blue-500",
      assigned: "bg-amber-500",
      resolved: "bg-emerald-500",
    };
    return colors[status as keyof typeof colors] || "bg-slate-500";
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: "text-emerald-400",
      medium: "text-amber-400",
      high: "text-orange-400",
      critical: "text-red-400",
    };
    return colors[severity as keyof typeof colors] || "text-slate-400";
  };

  // Check if user has a valid profile and role
  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="max-w-md mx-auto mt-20">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Loading Profile
            </h2>
            <p className="text-slate-400">
              Please wait while we load your profile...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has proper role
  if (
    profile.role !== "admin" &&
    profile.role !== "agent" &&
    profile.role !== "official"
  ) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="max-w-md mx-auto mt-20">
          <div className="bg-slate-900 border border-red-900/50 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Access Denied
            </h2>
            <p className="text-slate-400 mb-4">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-slate-500">
              Current role: {profile.role || "No role assigned"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-800 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-slate-800 rounded-xl"></div>
              ))}
            </div>
            <div className="h-96 bg-slate-800 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {dashboardTitle}
              </h1>
              {isOfficial && (
                <p className="text-slate-400 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Managing reports for {profile.department}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4 mt-4 lg:mt-0">
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              {stats.critical > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full">
                  <Bell className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-400 font-medium">
                    {stats.critical} Critical
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tab Navigation - Only show for admins */}
          {!isOfficial && (
            <div className="mb-8">
              <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg w-fit">
                <button
                  onClick={() => setActiveTab("reports")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === "reports"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Reports
                </button>
                <button
                  onClick={() => setActiveTab("officials")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === "officials"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Department Officials
                </button>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6 mb-8">
            {/* Department-specific stats for officials */}
            {isOfficial && stats.departmentSpecific && (
              <>
                <div className="bg-gradient-to-r from-blue-900/50 to-blue-800/30 border border-blue-500/20 rounded-xl p-6 hover:from-blue-900/60 hover:to-blue-800/40 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-300 text-sm font-medium mb-1">
                        New Today
                      </p>
                      <p className="text-3xl font-bold text-white">
                        {stats.departmentSpecific.todayNew}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <TrendingUp className="w-3 h-3 text-blue-400" />
                        <span className="text-xs text-blue-300">Active</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-amber-900/50 to-amber-800/30 border border-amber-500/20 rounded-xl p-6 hover:from-amber-900/60 hover:to-amber-800/40 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-300 text-sm font-medium mb-1">
                        Pending This Week
                      </p>
                      <p className="text-3xl font-bold text-white">
                        {stats.departmentSpecific.weekPending}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span className="text-xs text-amber-300">
                          Attention
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-amber-400" />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="bg-gradient-to-r from-slate-900/80 to-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:from-slate-900/90 hover:to-slate-800/60 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium mb-1">
                    Total Reports
                  </p>
                  <p className="text-3xl font-bold text-white">{stats.total}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {dateRange === "all"
                      ? "All time"
                      : dateRange === "week"
                      ? "Last 7 days"
                      : "Last 30 days"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-slate-300" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-900/50 to-red-800/30 border border-red-500/20 rounded-xl p-6 hover:from-red-900/60 hover:to-red-800/40 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-300 text-sm font-medium mb-1">
                    Critical Issues
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {stats.critical}
                  </p>
                  <p className="text-xs text-red-300 mt-2">
                    {stats.total > 0
                      ? Math.round((stats.critical / stats.total) * 100)
                      : 0}
                    % of total
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-900/50 to-orange-800/30 border border-orange-500/20 rounded-xl p-6 hover:from-orange-900/60 hover:to-orange-800/40 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-300 text-sm font-medium mb-1">
                    Avg. Response
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {stats.responseTime}d
                  </p>
                  <p className="text-xs text-orange-300 mt-2">
                    Until resolution
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-900/50 to-emerald-800/30 border border-emerald-500/20 rounded-xl p-6 hover:from-emerald-900/60 hover:to-emerald-800/40 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-300 text-sm font-medium mb-1">
                    Resolution Rate
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {stats.total
                      ? Math.round((stats.resolved / stats.total) * 100)
                      : 0}
                    %
                  </p>
                  <p className="text-xs text-emerald-300 mt-2">
                    {stats.resolved} resolved
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-slate-400 transition-all"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white appearance-none min-w-40"
                >
                  <option value="all">All Status</option>
                  <option value="submitted">Submitted</option>
                  <option value="verified">Verified</option>
                  <option value="assigned">Assigned</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={dateRange}
                  onChange={(e) =>
                    setDateRange(e.target.value as "all" | "week" | "month")
                  }
                  className="pl-10 pr-8 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white appearance-none min-w-40"
                >
                  <option value="all">All Time</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {(activeTab === "reports" || isOfficial) && (
          <>
            {/* Reports Table */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 shadow-xl rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <h2 className="text-xl font-semibold text-white">
                    {isOfficial
                      ? `${profile.department} Reports`
                      : "All Reports"}
                  </h2>
                  {isOfficial && (
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Department Official View
                    </span>
                  )}
                </div>
              </div>

              {/* Reports List */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Severity
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-900/20 divide-y divide-slate-800">
                    {getFilteredReports().map((report) => (
                      <tr
                        key={report.id}
                        className="hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">
                            {report.title}
                          </div>
                          <div className="text-sm text-slate-400">
                            {report.category}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${getStatusColor(
                              report.status
                            )}`}
                          >
                            {report.status.charAt(0).toUpperCase() +
                              report.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-sm font-medium capitalize ${getSeverityColor(
                              report.severity
                            )}`}
                          >
                            {report.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                          {report.createdAt.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Empty State */}
              {getFilteredReports().length === 0 && !loading && (
                <div className="bg-slate-900/50 backdrop-blur-sm border-t border-slate-800 rounded-xl p-12 text-center">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No Reports Found
                  </h3>
                  <p className="text-slate-400 mb-6">
                    {searchQuery || filter !== "all" || dateRange !== "all"
                      ? "Try adjusting your filters to see more reports."
                      : "There are no reports to display at this time."}
                  </p>
                  {(searchQuery || filter !== "all" || dateRange !== "all") && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setFilter("all");
                        setDateRange("all");
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Department Officials Tab */}
        {activeTab === "officials" && (
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 shadow-xl rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Department Officials
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Manage department officials and their assigned categories
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Official Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Password
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Assigned Categories
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-900/20 divide-y divide-slate-800">
                  {Object.entries(DEPARTMENT_OFFICIALS).map(
                    ([department, official]) => {
                      const departmentCategories = getCategoriesForDepartment(
                        department as any
                      );

                      return (
                        <tr
                          key={official.email}
                          className="hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-blue-400" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-white">
                                  {department}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-slate-400" />
                              <span className="text-sm text-slate-300 font-mono">
                                {official.email}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-slate-300 font-mono bg-slate-800/50 px-2 py-1 rounded">
                              {official.password}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {departmentCategories.map((category) => (
                                <span
                                  key={category}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                >
                                  {category}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                              <Shield className="w-3 h-3" />
                              Active
                            </span>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary Stats */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-800/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {Object.keys(DEPARTMENT_OFFICIALS).length}
                  </div>
                  <div className="text-sm text-slate-400">
                    Total Departments
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {CATEGORIES.length}
                  </div>
                  <div className="text-sm text-slate-400">Total Categories</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {Object.keys(DEPARTMENT_OFFICIALS).length}
                  </div>
                  <div className="text-sm text-slate-400">Active Officials</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Management Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm overflow-y-auto h-full w-full z-50 p-4">
            <div className="relative top-20 mx-auto max-w-md">
              <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">
                    Manage Report
                  </h3>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    <h4 className="font-semibold text-white mb-2">
                      {selectedReport.title}
                    </h4>
                    <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                      {selectedReport.description}
                    </p>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(
                          selectedReport.status
                        )}`}
                      >
                        {selectedReport.status.charAt(0).toUpperCase() +
                          selectedReport.status.slice(1)}
                      </span>
                      <span
                        className={`text-sm font-medium capitalize ${getSeverityColor(
                          selectedReport.severity
                        )}`}
                      >
                        {selectedReport.severity}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-3">
                        Update Status
                      </label>
                      <div className="space-y-2">
                        {["verified", "assigned", "resolved"].map((status) => (
                          <button
                            key={status}
                            onClick={() =>
                              updateReportStatus(selectedReport.id, status)
                            }
                            disabled={
                              updating || selectedReport.status === status
                            }
                            className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                              selectedReport.status === status
                                ? "bg-slate-800/50 border-slate-700 text-slate-500 cursor-not-allowed"
                                : "bg-slate-800/30 border-slate-700 hover:bg-slate-800/50 hover:border-slate-600 text-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {status === "verified" && (
                                <CheckCircle className="w-4 h-4" />
                              )}
                              {status === "assigned" && (
                                <UserCheck className="w-4 h-4" />
                              )}
                              {status === "resolved" && (
                                <CheckCircle className="w-4 h-4" />
                              )}
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {profiles.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                          Assign to Agent
                        </label>
                        <div className="relative">
                          <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                updateReportStatus(
                                  selectedReport.id,
                                  "assigned",
                                  e.target.value
                                );
                              }
                            }}
                            className="w-full pl-10 pr-4 py-3 bg-slate-800/30 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white appearance-none"
                            defaultValue=""
                          >
                            <option value="">Select an agent</option>
                            {profiles.map((profile) => (
                              <option key={profile.id} value={profile.id}>
                                {profile.fullName} ({profile.role})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => setSelectedReport(null)}
                    disabled={updating}
                    className="px-6 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? "Updating..." : "Close"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
