// Shared utility for building short, database-backed quotation share links.
// The share link references a unique cryptographic hash, which requests the snapshot
// dynamically from the PostgreSQL database, resulting in extremely clean and short links.

const HASH_SALT = "kpb-2026-stationerymart";

/**
 * Generates a unique secure share hash for a quotation.
 */
export const generateShareHash = (quotationId) => {
  try {
    return btoa(quotationId + HASH_SALT).replace(/[+/=]/g, "").slice(0, 14);
  } catch {
    return quotationId.slice(-10);
  }
};

/**
 * Builds a clean sharing link using the quotation's shareHash.
 */
export const buildShareLink = (q, settings, customers = []) => {
  const hash = q.shareHash || generateShareHash(q.id);
  return `${window.location.origin}/quotation/${encodeURIComponent(hash)}`;
};

/**
 * Decodes a share link hash (kept for backward compatibility, though routing is now backend-driven).
 */
export const decodeShareLink = (hashInUrl, ref, loadedQuotations, loadedSettings, loadedCustomers) => {
  // Now handled asynchronously via backend database queries in App.jsx.
  return null;
};
