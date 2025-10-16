import { ReportCategory } from '@/types/report';

export const REPORT_CATEGORIES = {
  [ReportCategory.ROAD_INFRASTRUCTURE]: {
    label: 'Roads & Infrastructure',
    icon: 'road',
    color: '#7C3AED',
    department: 'PWD'
  },
  [ReportCategory.WATER_SANITATION]: {
    label: 'Water & Sanitation',
    icon: 'droplet',
    color: '#0EA5E9',
    department: 'WATER'
  },
  [ReportCategory.ELECTRICITY]: {
    label: 'Electricity',
    icon: 'zap',
    color: '#F59E0B',
    department: 'POWER'
  },
  [ReportCategory.WASTE_MANAGEMENT]: {
    label: 'Waste Management',
    icon: 'trash',
    color: '#10B981',
    department: 'SANITATION'
  },
  [ReportCategory.PUBLIC_SAFETY]: {
    label: 'Public Safety',
    icon: 'shield',
    color: '#EF4444',
    department: 'POLICE'
  },
  [ReportCategory.HEALTHCARE]: {
    label: 'Healthcare',
    icon: 'heart',
    color: '#EC4899',
    department: 'HEALTH'
  },
  [ReportCategory.EDUCATION]: {
    label: 'Education',
    icon: 'book',
    color: '#8B5CF6',
    department: 'EDUCATION'
  },
  [ReportCategory.ENVIRONMENT]: {
    label: 'Environment',
    icon: 'leaf',
    color: '#22C55E',
    department: 'ENVIRONMENT'
  },
  [ReportCategory.TRAFFIC]: {
    label: 'Traffic',
    icon: 'car',
    color: '#F97316',
    department: 'TRAFFIC'
  },
  [ReportCategory.OTHER]: {
    label: 'Other',
    icon: 'more-horizontal',
    color: '#6B7280',
    department: 'GENERAL'
  }
};

export const SEVERITY_LEVELS = {
  low: { label: 'Low', color: '#10B981', priority: 1 },
  medium: { label: 'Medium', color: '#F59E0B', priority: 2 },
  high: { label: 'High', color: '#EF4444', priority: 3 },
  critical: { label: 'Critical', color: '#DC2626', priority: 4 }
};

export const STATUS_LABELS = {
  submitted: { label: 'Submitted', color: '#6B7280' },
  under_review: { label: 'Under Review', color: '#F59E0B' },
  assigned: { label: 'Assigned', color: '#3B82F6' },
  in_progress: { label: 'In Progress', color: '#8B5CF6' },
  resolved: { label: 'Resolved', color: '#10B981' },
  rejected: { label: 'Rejected', color: '#EF4444' }
};