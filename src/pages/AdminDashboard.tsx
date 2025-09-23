import { useState, useEffect } from "react";
import {
  Users,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Filter,
  Search,
  UserCheck,
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

  useEffect(() => {
    // Debug logging
    console.log("Current user:", user?.email);
    console.log("Current profile:", profile);
  }, [user, profile]);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [updating, setUpdating] = useState(false);
  const [dateRange, setDateRange] = useState<"all" | "week" | "month">("all");
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
    // Create query based on user role
    const reportsQuery =
      profile?.role === "official"
        ? query(
            collection(db, "reports"),
            where("department", "==", profile.department),
            orderBy("createdAt", "desc")
          )
        : query(collection(db, "reports"), orderBy("createdAt", "desc"));

    const unsubscribeReports = onSnapshot(reportsQuery, (snapshot) => {
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
    });

    // Set up real-time listener for profiles (agents)
    const profilesQuery = query(
      collection(db, "profiles"),
      where("role", "in", ["agent", "admin"])
    );

    const unsubscribeProfiles = onSnapshot(profilesQuery, (snapshot) => {
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
    });

    return () => {
      unsubscribeReports();
      unsubscribeProfiles();
    };
  }, []);

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
      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      if (assignedTo) {
        updateData.assignedTo = assignedTo;
      }

      await updateDoc(doc(db, "reports", reportId), updateData);

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
      submitted: "bg-gray-500",
      verified: "bg-blue-500",
      assigned: "bg-yellow-500",
      resolved: "bg-green-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: "text-green-600",
      medium: "text-yellow-600",
      high: "text-orange-600",
      critical: "text-red-600",
    };
    return colors[severity as keyof typeof colors] || "text-gray-600";
  };

  // Check if user has a valid profile and role
  if (!profile) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Loading Profile
          </h2>
          <p className="text-gray-600">
            Please wait while we load your profile...
          </p>
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
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Current role: {profile.role || "No role assigned"}
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {dashboardTitle}
          </h1>
          {isOfficial && (
            <p className="text-sm text-gray-600 mb-4">
              Welcome back! You are managing reports for {profile.department}
            </p>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Department-specific stats for officials */}
            {isOfficial && stats.departmentSpecific && (
              <>
                <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        New Today
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.departmentSpecific.todayNew}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Pending This Week
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.departmentSpecific.weekPending}
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
              </>
            )}
            <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Reports
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {dateRange === "all"
                      ? "All time"
                      : dateRange === "week"
                      ? "Last 7 days"
                      : "Last 30 days"}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Critical Issues
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.critical}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.round((stats.critical / stats.total) * 100)}% of total
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Avg. Response Time
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.responseTime} days
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Until resolution</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Resolution Rate
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.total
                      ? Math.round((stats.resolved / stats.total) * 100)
                      : 0}
                    %
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.resolved} of {stats.total} resolved
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Filters */}
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

            <div className="flex gap-4">
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

              <div className="relative">
                <select
                  value={dateRange}
                  onChange={(e) =>
                    setDateRange(e.target.value as "all" | "week" | "month")
                  }
                  className="pl-4 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Time</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                {isOfficial ? `${profile.department} Reports` : "All Reports"}
              </h2>
              {isOfficial && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Department Official View
                </span>
              )}
            </div>
          </div>

          {/* Reports List */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredReports().map((report) => (
                  <tr key={report.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {report.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {report.category}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${getStatusColor(
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Report Management Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Manage Report
                </h3>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-1">
                    {selectedReport.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {selectedReport.description}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(
                        selectedReport.status
                      )}`}
                    >
                      {selectedReport.status.charAt(0).toUpperCase() +
                        selectedReport.status.slice(1)}
                    </span>
                    <span
                      className={`text-xs font-medium capitalize ${getSeverityColor(
                        selectedReport.severity
                      )}`}
                    >
                      {selectedReport.severity}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                          className={`w-full text-left px-3 py-2 rounded border ${
                            selectedReport.status === status
                              ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {profiles.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assign to Agent
                      </label>
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  )}
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
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
