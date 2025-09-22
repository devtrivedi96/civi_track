export const ADMIN_EMAILS: string[] = [
  "admin@civitrack.gov.in",
  // Add more admin emails as needed
];

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
