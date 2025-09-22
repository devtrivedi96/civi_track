import { format } from "date-fns";
import { MapPin, Calendar, User, Eye } from "lucide-react";
import { Report } from "../lib/firebase";

interface ReportCardProps {
  report: Report;
  onClick: () => void;
}

export function ReportCard({ report, onClick }: ReportCardProps) {
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

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer p-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(
              report.status
            )}`}
          >
            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
          </span>
          <span
            className={`px-2 py-1 rounded text-xs font-medium border capitalize ${getSeverityColor(
              report.severity
            )}`}
          >
            {report.severity}
          </span>
        </div>
        <Eye className="w-4 h-4 text-gray-400" />
      </div>

      {/* Content */}
      <div className="flex space-x-3">
        {/* Thumbnail */}
        {report.thumbnail && (
          <div className="flex-shrink-0 w-20 h-20 rounded overflow-hidden">
            <img
              src={report.thumbnail}
              alt={report.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        {/* Thumbnail */}
        {report.thumbnail ? (
          <img
            src={report.thumbnail}
            alt="Report thumbnail"
            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <MapPin className="w-6 h-6 text-gray-400" />
          </div>
        )}

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
            {report.title}
          </h3>

          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {report.description}
          </p>

          <div className="flex items-center text-xs text-gray-500 space-x-4">
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {format(report.createdAt, "MMM dd, yyyy")}
            </div>

            <div className="flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              <span className="truncate max-w-24">
                {report.address || "Location set"}
              </span>
            </div>

            <div className="flex items-center">
              <User className="w-3 h-3 mr-1" />
              {report.category}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
