export const DEPARTMENTS = {
  "Road Infrastructure": "Public Works",
  "Water Supply": "Water Department",
  Electricity: "Electricity Board",
  "Waste Management": "Sanitation",
  "Public Safety": "Law Enforcement",
  Healthcare: "Health Department",
  Education: "Education Department",
  Environment: "Environmental Protection",
  Transportation: "Transport Department",
  "Parks and Recreation": "Parks Department",
} as const;

export type Department = keyof typeof DEPARTMENTS;
export type DepartmentValue = (typeof DEPARTMENTS)[Department];

export const CATEGORIES = Object.keys(DEPARTMENTS) as Department[];

// Helper function to get department from category
export function getDepartmentFromCategory(
  category: Department
): DepartmentValue {
  return DEPARTMENTS[category];
}

// Helper function to get categories for a department
export function getCategoriesForDepartment(
  department: DepartmentValue
): Department[] {
  return Object.entries(DEPARTMENTS)
    .filter(([_, dept]) => dept === department)
    .map(([category]) => category as Department);
}
