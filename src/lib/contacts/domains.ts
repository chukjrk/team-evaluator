export const PERSONAL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "msn.com",
  "protonmail.com",
  "proton.me",
  "fastmail.com",
]);

/**
 * Extracts the domain from an email address. Returns empty string if invalid.
 */
export function extractDomain(email: string): string {
  const atIdx = email.lastIndexOf("@");
  if (atIdx < 0) return "";
  return email.slice(atIdx + 1).toLowerCase().trim();
}

/**
 * Converts a company domain to a human-readable company name.
 * e.g. "stripe.com" → "Stripe", "notion.so" → "Notion"
 */
export function domainToCompanyName(domain: string): string {
  // Remove TLD: take the second-to-last segment (or first if only one segment)
  const parts = domain.split(".");
  const name = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
  // Capitalize first letter
  return name.charAt(0).toUpperCase() + name.slice(1);
}
