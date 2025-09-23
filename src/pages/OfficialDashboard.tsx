import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db, Report } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import { OfficialReportCard } from "../components/OfficialReportCard";
import { useNavigate } from "react-router-dom";
import {
  getCategoriesForDepartment,
  DepartmentValue,
} from "../utils/departments";
import { Clock, Filter, Search, ChevronDown } from "lucide-react";

export function OfficialDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "resolved">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;

    // Get categories for this official's department
    let reportsQuery;

    if (profile.department) {
      // Prefer department-mirrored collection for efficient queries
      reportsQuery = query(
        collection(db, "department_reports", profile.department, "reports"),
        orderBy("createdAt", "desc")
      );
    } else {
      // Fallback query if department is not set
      reportsQuery = query(
        collection(db, "reports"),
        where("assignedOfficialId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
    }

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
  }, [user, profile]);

  const handleStatusUpdate = async (reportId: string, newStatus: string) => {
    try {
      const reportRef = doc(db, "reports", reportId);
      await updateDoc(reportRef, {
        status: newStatus,
        updatedAt: new Date(),
        handledBy: user?.uid,
      });

      // Add status history
      await addDoc(collection(db, "statusHistory"), {
        reportId: reportId,
        status: newStatus,
        changedBy: user?.uid,
        notes: `Status updated to ${newStatus} by ${profile?.fullName}`,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleReportClick = (report: Report) => {
    navigate(`/official/report/${report.id}`);
  };

  const filteredReports = reports.filter((report) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "pending" && report.status !== "resolved") ||
      (filter === "resolved" && report.status === "resolved");

    const matchesSearch =
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Status colors are handled by the ReportCard component

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              My Assigned Reports
            </h1>
            <p className="text-gray-600">
              Manage and respond to reports assigned to your department
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              <Filter className="w-5 h-5 text-gray-500" />
              <span>Filter</span>
              <ChevronDown
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                  isFilterOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* Filter Panel */}
          {isFilterOpen && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 rounded-lg ${
                    filter === "all"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  All Reports
                </button>
                <button
                  onClick={() => setFilter("pending")}
                  className={`px-4 py-2 rounded-lg ${
                    filter === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilter("resolved")}
                  className={`px-4 py-2 rounded-lg ${
                    filter === "resolved"
                      ? "bg-green-100 text-green-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Resolved
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <OfficialReportCard
                key={report.id}
                report={report}
                onStatusUpdate={handleStatusUpdate}
                onClick={() => handleReportClick(report)}
              />
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No reports found
              </h3>
              <p className="text-gray-600">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "You have no assigned reports at the moment"}
              </p>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Reports Overview
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Assigned</span>
                <span className="font-medium text-gray-900">
                  {reports.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending</span>
                <span className="font-medium text-yellow-600">
                  {reports.filter((r) => r.status !== "resolved").length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Resolved</span>
                <span className="font-medium text-green-600">
                  {reports.filter((r) => r.status === "resolved").length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
