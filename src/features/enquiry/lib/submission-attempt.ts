import type { ConfiguratorSubmissionPayload } from "@/types/configurator";

const STORAGE_KEY = "go-pods.configurator.pending-submission";
type AttemptStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface SubmissionAttempt {
  fingerprint: string;
  id: string;
  persisted: boolean;
}

function browserStorage(): AttemptStorage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function readAttempt(storage: AttemptStorage | null): SubmissionAttempt | null {
  try {
    const value = JSON.parse(storage?.getItem(STORAGE_KEY) ?? "null");
    if (
      typeof value?.id === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.id) &&
      typeof value.fingerprint === "string" &&
      /^[0-9a-f]{64}$/.test(value.fingerprint)
    ) {
      return { id: value.id, fingerprint: value.fingerprint, persisted: true };
    }
  } catch {
    // Blocked storage and malformed entries cannot prevent same-page retries.
  }
  return null;
}

export async function getSubmissionAttempt(
  previous: SubmissionAttempt | null,
  payload: ConfiguratorSubmissionPayload,
  storage: AttemptStorage | null = browserStorage(),
): Promise<SubmissionAttempt> {
  const details = payload.customerDetails;
  // Explicit field order keeps the digest stable regardless of object key order.
  const canonicalPayload = JSON.stringify({
    selectedModelSlug: payload.selectedModelSlug,
    selectedOptionIds: [...new Set(payload.selectedOptionIds)].sort(),
    customerDetails: {
      name: details.name,
      email: details.email,
      phone: details.phone,
      postcode: details.postcode,
      notes: details.notes,
      marketingConsent: details.marketingConsent,
      enquiryType: details.enquiryType,
    },
  });
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalPayload));
  const fingerprint = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const existing = previous?.fingerprint === fingerprint ? previous : readAttempt(storage);
  const id = existing?.fingerprint === fingerprint ? existing.id : crypto.randomUUID();
  let persisted = false;
  try {
    if (storage) {
      // Never persist the payload or customer fields, only its digest and retry ID.
      storage.setItem(STORAGE_KEY, JSON.stringify({ id, fingerprint }));
      persisted = true;
    }
  } catch {
    // The caller retains the attempt in memory if browser storage is unavailable.
  }
  return { id, fingerprint, persisted };
}

export function clearSubmissionAttempt(
  attempt: SubmissionAttempt,
  storage: AttemptStorage | null = browserStorage(),
): void {
  try {
    if (readAttempt(storage)?.id === attempt.id) storage?.removeItem(STORAGE_KEY);
  } catch {
    // A storage restriction must not hide an already-confirmed successful enquiry.
  }
}
