"use server";

import { configuratorApi, ConfiguratorApiError } from "@/lib/configurator-api";
import { validateConfiguratorSubmission } from "@/features/enquiry/lib/validate-configurator-submission";
import type { ConfiguratorSubmissionPayload, ConfiguratorSubmissionResult, ConfiguratorSubmissionSuccess, ConfiguratorValidationErrors } from "@/types/configurator";

export async function submitConfiguratorEnquiry(payload: ConfiguratorSubmissionPayload, submissionId: string): Promise<ConfiguratorSubmissionResult> {
  const validation = validateConfiguratorSubmission(payload);
  if (!validation.isValid) return { status: "error", errors: validation.errors };
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId)) {
    return { status: "error", errors: { form: "Please refresh the page and try again." } };
  }
  try {
    return await configuratorApi<ConfiguratorSubmissionSuccess>("submissions", {
      method: "POST", headers: { "Idempotency-Key": submissionId },
      body: JSON.stringify({ ...payload, submission_id: submissionId }),
    });
  } catch (error) {
    if (error instanceof ConfiguratorApiError && error.status === 422 && error.errors) {
      const errors: ConfiguratorValidationErrors = {};
      const fields: Record<string, keyof ConfiguratorValidationErrors> = {
        selectedModelSlug: "selectedModelSlug", "customerDetails.name": "name", "customerDetails.email": "email",
        "customerDetails.phone": "phone", "customerDetails.enquiryType": "enquiryType",
        name: "name", email: "email", phone: "phone", enquiryType: "enquiryType", form: "form",
      };
      for (const [field, messages] of Object.entries(error.errors)) {
        errors[fields[field] ?? "form"] = Array.isArray(messages) ? messages[0] : messages;
      }
      return { status: "error", errors };
    }
    return { status: "error", errors: { form: "We could not confirm your enquiry. Please try again; retrying the same enquiry will not create a duplicate." } };
  }
}
