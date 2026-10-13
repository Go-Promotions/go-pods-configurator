import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSubmissionAttempt, getSubmissionAttempt } from "./submission-attempt";
import type { ConfiguratorSubmissionPayload } from "@/types/configurator";

const payload: ConfiguratorSubmissionPayload = {
  selectedModelSlug: "classic",
  selectedOptionIds: ["a", "b"],
  customerDetails: {
    name: "Customer", email: "test@example.com", phone: "07123456789",
    postcode: "AB12 3CD", notes: "Private message", marketingConsent: false,
    enquiryType: "general_enquiry",
  },
};

describe("submission intent identity", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal("crypto", webcrypto);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("restores a pending attempt after losing all component state, including reordered payload keys", async () => {
    const attempt = await getSubmissionAttempt(null, payload);
    const retry = await getSubmissionAttempt(null, {
      customerDetails: { ...payload.customerDetails },
      selectedOptionIds: ["b", "a"], selectedModelSlug: "classic",
    });
    expect(retry.id).toBe(attempt.id);
    expect(retry.persisted).toBe(true);
  });

  it("starts a new attempt for changed choices or customer details", async () => {
    const attempt = await getSubmissionAttempt(null, payload);
    const changedModel = await getSubmissionAttempt(null, { ...payload, selectedModelSlug: "pioneer" });
    const changedDetails = await getSubmissionAttempt(null, {
      ...payload, customerDetails: { ...payload.customerDetails, notes: "Changed" },
    });
    expect(changedModel.id).not.toBe(attempt.id);
    expect(changedDetails.id).not.toBe(attempt.id);
    expect(changedDetails.id).not.toBe(changedModel.id);
  });

  it("clears persisted identity only after confirmed success", async () => {
    const attempt = await getSubmissionAttempt(null, payload);
    clearSubmissionAttempt(attempt);
    expect(sessionStorage.length).toBe(0);
    expect((await getSubmissionAttempt(null, payload)).id).not.toBe(attempt.id);
  });

  it("stores only a UUID and SHA-256 payload digest, never customer fields", async () => {
    const attempt = await getSubmissionAttempt(null, payload);
    expect(sessionStorage.length).toBe(1);
    const stored = JSON.parse(sessionStorage.getItem(sessionStorage.key(0)!)!);
    expect(stored).toEqual({ id: attempt.id, fingerprint: expect.stringMatching(/^[a-f0-9]{64}$/) });
    for (const value of ["Customer", "test@example.com", "07123456789", "AB12 3CD", "Private message"]) {
      expect(JSON.stringify(stored)).not.toContain(value);
    }
  });

  it("keeps same-mount retries working when storage is unavailable", async () => {
    const blockedStorage = {
      getItem: () => { throw new Error("Blocked"); },
      setItem: () => { throw new Error("Blocked"); },
      removeItem: () => { throw new Error("Blocked"); },
    };
    const attempt = await getSubmissionAttempt(null, payload, blockedStorage);
    const retry = await getSubmissionAttempt(attempt, payload, blockedStorage);
    expect(retry.id).toBe(attempt.id);
    expect(retry.persisted).toBe(false);
    expect(() => clearSubmissionAttempt(retry, blockedStorage)).not.toThrow();
  });

  it.each(["not-json", "null", '{"id":"not-a-uuid","fingerprint":"bad"}'])("ignores malformed stored state: %s", async (invalid) => {
    const attempt = await getSubmissionAttempt(null, payload);
    const key = sessionStorage.key(0)!;
    sessionStorage.setItem(key, invalid);
    const retry = await getSubmissionAttempt(null, payload);
    expect(retry.id).not.toBe(attempt.id);
    expect(retry.persisted).toBe(true);
  });
});
