// Shared utility for building self-contained quotation share links.
// The full quotation + store settings are base64-encoded into the URL hash,
// so the link works on ANY device without requiring login or localStorage.

const HASH_SALT = "kpb-2025-stationerymart";

export const generateShareHash = (quotationId) => {
  try {
    return btoa(quotationId + HASH_SALT).replace(/[+/=]/g, "").slice(0, 14);
  } catch {
    return quotationId.slice(-10);
  }
};

/**
 * Builds a self-contained share URL.
 * The URL hash encodes: { quotation (with customer fields), settings snapshot, integrity hash }.
 * Unicode-safe via encodeURIComponent/decodeURIComponent wrapping.
 */
export const buildShareLink = (q, settings, customers = []) => {
  const customer = customers.find(c => c.id === q.customerId) || {};
  const integrityHash = generateShareHash(q.id);

  const snapshot = {
    quotation: {
      id: q.id,
      quotationNumber: q.quotationNumber,
      date: q.date,
      customerName: q.customerName,
      customerId: q.customerId,
      // Embed customer contact details so public view shows full info
      customerPhone: customer.phone || q.customerPhone || "",
      customerEmail: customer.email || q.customerEmail || "",
      customerAddress: customer.address || q.customerAddress || "",
      customerGst: customer.gst || q.customerGst || "",
      items: q.items,
      grandTotal: q.grandTotal,
      discount: q.discount || 0,
      terms: q.terms || [],
      bankDetails: q.bankDetails || {},
      status: q.status,
    },
    // Embed the store settings needed for rendering the letterhead
    settings: {
      storeName: settings?.storeName || "",
      tagline: settings?.tagline || "",
      established: settings?.established || "",
      address: settings?.address || "",
      phone: settings?.phone || "",
      email: settings?.email || "",
      gstin: settings?.gstin || "",
      bankAccountNo: settings?.bankAccountNo || "",
      bankIfsc: settings?.bankIfsc || "",
      bankName: settings?.bankName || "",
    },
    h: integrityHash,
  };

  try {
    // Unicode-safe base64 encoding
    const json = JSON.stringify(snapshot);
    const encoded = btoa(unescape(encodeURIComponent(json)));
    return `${window.location.origin}/quotation/${encodeURIComponent(q.quotationNumber)}#${encoded}`;
  } catch {
    // Fallback: simple hash-only link (same-device only)
    return `${window.location.origin}/quotation/${encodeURIComponent(q.quotationNumber)}#${integrityHash}`;
  }
};

/**
 * Decodes a share link hash.
 * Returns { quotation, settings, customers: [] } on success, or null on failure.
 * Supports both new snapshot format and old short-hash format (localStorage fallback).
 */
export const decodeShareLink = (hashInUrl, ref, loadedQuotations, loadedSettings, loadedCustomers) => {
  if (!hashInUrl) return null;

  // ── Try NEW format: base64-encoded JSON snapshot ──────────────────────────
  try {
    const json = decodeURIComponent(escape(atob(hashInUrl)));
    const snapshot = JSON.parse(json);
    if (
      snapshot?.quotation?.id &&
      snapshot?.settings &&
      snapshot?.h === generateShareHash(snapshot.quotation.id)
    ) {
      return {
        quotation: snapshot.quotation,
        settings: snapshot.settings,
        customers: loadedCustomers, // still pass loaded customers for phone lookup fallback
      };
    }
  } catch {
    // Not a valid snapshot — try old format below
  }

  // ── Fallback: old short-hash format (same device / localStorage) ──────────
  if (ref && loadedQuotations && loadedSettings) {
    const found = loadedQuotations.find(q => q.quotationNumber === ref);
    if (found) {
      const expectedHash = generateShareHash(found.id);
      if (hashInUrl === expectedHash) {
        return {
          quotation: found,
          settings: loadedSettings,
          customers: loadedCustomers,
        };
      }
    }
  }

  return null; // Invalid link
};
