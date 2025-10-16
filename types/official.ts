export interface Official {
  id: string;
  email: string;
  name: string;
  department: string;
  designation: string;
  isVerified: boolean;
  badgeNumber: string;
  createdAt: Date;
  verifiedAt?: Date;
  assignedArea?: {
    name: string;
    coordinates: {
      latitude: number;
      longitude: number;
    }[];
  };
}

export interface OfficialVerification {
  officialId: string;
  documentUrls: string[];
  status: "pending" | "approved" | "rejected";
  notes?: string;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}
