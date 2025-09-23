import { format } from "date-fns";
import {
  MapPin,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { Report } from "../lib/firebase";

interface OfficialReportCardProps {
  report: Report;
  onStatusUpdate: (reportId: string, newStatus: string) => void;
  onClick: () => void;
}

export function OfficialReportCard({
  report,
  onStatusUpdate,
  onClick,
}: OfficialReportCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-gray-500";
      case "verified":
        return "bg-blue-500";
      case "assigned":
        return "bg-yellow-500";
      case "resolved":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 overflow-hidden">
      {/* Header with gradient overlay */}
      <div className="relative h-48">
        {report.thumbnail ? (
          <img
            src={report.thumbnail}
            alt={report.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <MapPin className="w-12 h-12 text-white/80" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium text-white backdrop-blur-sm bg-white/10 border border-white/20 ${getStatusColor(
                  report.status
                )}`}
              >
                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm bg-white/10 border border-white/20 capitalize ${getSeverityColor(
                  report.severity
                )}`}
              >
                {report.severity}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 text-lg line-clamp-2">
            {report.title}
          </h3>

          <p className="text-sm text-gray-600 line-clamp-2">
            {report.description}
          </p>

          {/* Category and Location */}
          <div className="flex items-center gap-4">
            <div className="flex items-center text-sm text-gray-500">
              <div className="p-1.5 bg-gray-100 rounded mr-2">
                <MapPin className="w-4 h-4 text-gray-600" />
              </div>
              {`${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                {format(report.createdAt, "MMM dd, yyyy")}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <User className="w-4 h-4 mr-1.5 text-gray-400" />
                {report.category}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {report.status !== "resolved" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusUpdate(report.id, "resolved");
                  }}
                  className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Resolve
                </button>
              )}
              {report.status === "submitted" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusUpdate(report.id, "rejected");
                  }}
                  className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Reject
                </button>
              )}
              {report.status === "submitted" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusUpdate(report.id, "verified");
                  }}
                  className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  <Clock className="w-4 h-4 mr-1.5" />
                  Verify
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
