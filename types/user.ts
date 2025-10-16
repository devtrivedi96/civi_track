export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  department?: Department;
  profileImage?: string;
  isVerified: boolean;
  createdAt: Date;
  lastLogin: Date;
  points: number;
  level: number;
  achievements: string[];
  settings: UserSettings;
}

export enum UserRole {
  USER = 'user',
  OFFICIAL = 'official',
  ADMIN = 'admin'
}

export interface UserSettings {
  notifications: {
    reportUpdates: boolean;
    achievements: boolean;
    newReports: boolean;
  };
  privacy: {
    showProfile: boolean;
    showReports: boolean;
  };
}

export interface Department {
  id: string;
  name: string;
  code: string;
  color: string;
  icon: string;
}

export interface Official extends User {
  department: Department;
  assignedReports: string[];
  isActive: boolean;
  workingHours: {
    start: string;
    end: string;
  };
}