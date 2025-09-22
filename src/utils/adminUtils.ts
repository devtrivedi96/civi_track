import { Timestamp } from "firebase/firestore";

export interface StatusUpdatePayload {
  reportId: string;
  status: string;
  notes: string;
  assignedTo?: string;
  priority?: "low" | "medium" | "high" | "critical";
  estimatedCompletionDate?: Date;
}

export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  data: {
    reportId: string;
    status: string;
    [key: string]: string;
  };
}

export const STATUS_TYPES = {
  SUBMITTED: "submitted",
  IN_PROGRESS: "in-progress",
  ASSIGNED: "assigned",
  UNDER_REVIEW: "under-review",
  RESOLVED: "resolved",
  REJECTED: "rejected",
} as const;

export const PRIORITY_LEVELS = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
} as const;

export function getStatusColor(status: string): string {
  const colors = {
    [STATUS_TYPES.SUBMITTED]: "bg-gray-500",
    [STATUS_TYPES.IN_PROGRESS]: "bg-yellow-500",
    [STATUS_TYPES.ASSIGNED]: "bg-blue-500",
    [STATUS_TYPES.UNDER_REVIEW]: "bg-purple-500",
    [STATUS_TYPES.RESOLVED]: "bg-green-500",
    [STATUS_TYPES.REJECTED]: "bg-red-500",
  };
  return colors[status as keyof typeof colors] || "bg-gray-500";
}

export function getPriorityColor(priority: string): string {
  const colors = {
    [PRIORITY_LEVELS.LOW]: "bg-blue-100 text-blue-800",
    [PRIORITY_LEVELS.MEDIUM]: "bg-yellow-100 text-yellow-800",
    [PRIORITY_LEVELS.HIGH]: "bg-orange-100 text-orange-800",
    [PRIORITY_LEVELS.CRITICAL]: "bg-red-100 text-red-800",
  };
  return colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-800";
}

export function getStatusDescription(status: string): string {
  const descriptions = {
    [STATUS_TYPES.SUBMITTED]: "Issue reported and awaiting review",
    [STATUS_TYPES.IN_PROGRESS]: "Work has begun on addressing the issue",
    [STATUS_TYPES.ASSIGNED]: "Issue assigned to municipal staff",
    [STATUS_TYPES.UNDER_REVIEW]: "Solution being reviewed for completion",
    [STATUS_TYPES.RESOLVED]: "Issue has been successfully addressed",
    [STATUS_TYPES.REJECTED]: "Issue cannot be addressed or is invalid",
  };
  return descriptions[status as keyof typeof descriptions] || "Unknown status";
}

export function formatTimestamp(timestamp: Timestamp | null): string {
  if (!timestamp) return "N/A";
  return new Date(timestamp.toMillis()).toLocaleString();
}

export function calculateProgress(
  currentStatus: (typeof STATUS_TYPES)[keyof typeof STATUS_TYPES]
): number {
  const statusOrder: Array<(typeof STATUS_TYPES)[keyof typeof STATUS_TYPES]> = [
    STATUS_TYPES.SUBMITTED,
    STATUS_TYPES.ASSIGNED,
    STATUS_TYPES.IN_PROGRESS,
    STATUS_TYPES.UNDER_REVIEW,
    STATUS_TYPES.RESOLVED,
  ];

  const currentIndex = statusOrder.indexOf(currentStatus);
  if (currentIndex === -1) return 0;

  return Math.round((currentIndex / (statusOrder.length - 1)) * 100);
}

export function calculateResponseTime(
  createdAt: Timestamp,
  firstResponseAt: Timestamp | null
): number {
  if (!firstResponseAt) return 0;
  return Math.round(
    (firstResponseAt.toMillis() - createdAt.toMillis()) / (1000 * 60 * 60)
  ); // Hours
}

export function generateStatusUpdateMessage(
  update: StatusUpdatePayload
): string {
  const baseMessage = `Report status updated to ${update.status}`;
  if (update.assignedTo) {
    return `${baseMessage} and assigned to municipal staff`;
  }
  if (update.estimatedCompletionDate) {
    return `${baseMessage}. Estimated completion by ${update.estimatedCompletionDate.toLocaleDateString()}`;
  }
  return baseMessage;
}
