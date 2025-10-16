import { UserRole } from "./user";

export interface Report {
  id: string;
  title: string;
  description: string;
  category: ReportCategory;
  severity: ReportSeverity;
  status: ReportStatus;
  location: Location;
  images: string[];
  userId: string;
  assignedOfficialId?: string;
  departmentId: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  upvotes: number;
  downvotes: number;
  commentsCount: number;
  isAnonymous: boolean;
  tags: string[];
}

export enum ReportCategory {
  ROAD_INFRASTRUCTURE = "road_infrastructure",
  WATER_SANITATION = "water_sanitation",
  ELECTRICITY = "electricity",
  WASTE_MANAGEMENT = "waste_management",
  PUBLIC_SAFETY = "public_safety",
  HEALTHCARE = "healthcare",
  EDUCATION = "education",
  ENVIRONMENT = "environment",
  TRAFFIC = "traffic",
  OTHER = "other",
}

export enum ReportSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum ReportStatus {
  SUBMITTED = "submitted",
  UNDER_REVIEW = "under_review",
  ASSIGNED = "assigned",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
  REJECTED = "rejected",
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
}

export interface ReportComment {
  id: string;
  reportId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  content: string;
  isOfficial: boolean;
  createdAt: Date;
  attachments?: string[];
}

export interface StatusUpdate {
  id: string;
  reportId: string;
  status: ReportStatus;
  comment?: string;
  updatedBy: string;
  updatedAt: Date;
}
