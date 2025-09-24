// Utility function to normalize department names from profile to collection naming
export function normalizeDepartmentName(profileDepartment: string): string {
  const departmentMap: Record<string, string> = {
    publicworks: "Public Works",
    waterdepartment: "Water Department",
    electricityboard: "Electricity Board",
    sanitation: "Sanitation",
    lawenforcement: "Law Enforcement",
    healthdepartment: "Health Department",
    educationdepartment: "Education Department",
    environmentalprotection: "Environmental Protection",
    transportdepartment: "Transport Department",
    parksdepartment: "Parks Department",
  };

  return departmentMap[profileDepartment?.toLowerCase()] || profileDepartment;
}
