import { format } from "date-fns";
import { 
  MapPin, 
  Calendar, 
  User, 
  Clock,
  CheckCircle,
  UserCheck,
  Eye,
  AlertCircle
} from "lucide-react";
import { Report } from "../lib/firebase";

interface ReportCardProps {
  report: Report;
  onClick: () => void;
}

export function ReportCard({ report, onClick }: ReportCardProps) {
  const getStatusIcon = (status: string) => {
    const icons = {
      submitted: Clock,
      verified: Eye,
      assigned: UserCheck,
      resolved: CheckCircle,
    };
    return icons[status as keyof typeof icons] || AlertCircle;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      submitted: "bg-slate-500 dark:bg-slate-400",
      verified: "bg-blue-500 dark:bg-blue-400", 
      assigned: "bg-amber-500 dark:bg-amber-400",
      resolved: "bg-emerald-500 dark:bg-emerald-400",
    };
    return colors[status as keyof typeof colors] || "bg-slate-500 dark:bg-slate-400";
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: "text-emerald-700 bg-emerald-100 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700/50",
      medium: "text-amber-700 bg-amber-100 border-amber-200 dark:text-amber-300 dark:bg-amber-900/30 dark:border-amber-700/50", 
      high: "text-orange-700 bg-orange-100 border-orange-200 dark:text-orange-300 dark:bg-orange-900/30 dark:border-orange-700/50",
      critical: "text-red-700 bg-red-100 border-red-200 dark:text-red-300 dark:bg-red-900/30 dark:border-red-700/50",
    };
    return (
      colors[severity as keyof typeof colors] ||
      "text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-600"
    );
  };

  const getProgressPercentage = (status: string) => {
    const progress = {
      submitted: 25,
      verified: 50,
      assigned: 75,
      resolved: 100
    };
    return progress[status as keyof typeof progress] || 0;
  };

  return (
    <div
      onClick={onClick}
      className="group bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-md dark:hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
    >
      <div className="flex">
        {/* Left Image Section */}
        <div className="relative w-24 h-20 sm:w-28 sm:h-24 flex-shrink-0">
          {report.thumbnail ? (
            <img
              src={report.thumbnail}
              alt={report.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-slate-400 dark:text-slate-500" />
            </div>
          )}
        </div>

        {/* Right Content Section */}
        <div className="flex-1 p-3 sm:p-4 min-w-0">
          {/* Header with Status and Severity */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${getStatusColor(
                  report.status
                )}`}
              >
                {(() => {
                  const StatusIcon = getStatusIcon(report.status);
                  return <StatusIcon className="w-3 h-3 mr-1" />;
                })()}
                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
              </span>
            </div>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getSeverityColor(
                report.severity
              )}`}
            >
              {report.severity}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base mb-1 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {report.title}
          </h3>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-1">
            {report.description}
          </p>

          {/* Meta Information */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              <span>{format(report.createdAt, "MMM dd, yyyy")}</span>
            </div>
            <div className="flex items-center">
              <User className="w-3 h-3 mr-1" />
              <span className="capitalize truncate max-w-16 sm:max-w-20">
                {report.category}
              </span>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mb-2">
            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">
              {report.address || "Location not specified"}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-600 dark:text-slate-400">Progress</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {getProgressPercentage(report.status)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1">
                <div
                  className={`h-1 rounded-full transition-all duration-300 ${getStatusColor(report.status)}`}
                  style={{ width: `${getProgressPercentage(report.status)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}