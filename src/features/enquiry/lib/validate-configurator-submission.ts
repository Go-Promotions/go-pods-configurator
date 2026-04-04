import type {
  ConfiguratorSubmissionPayload,
  ConfiguratorValidationIssue,
  ConfiguratorValidationErrors,
} from "@/types/configurator";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateConfiguratorSubmission(
  payload: ConfiguratorSubmissionPayload,
) {
  const errors: ConfiguratorValidationErrors = {};
  const issues: ConfiguratorValidationIssue[] = [];

  if (!payload.selectedModelSlug) {
    errors.selectedModelSlug = "Choose a Go-Pod model before submitting.";
    issues.push({
      step: "model",
      field: "selectedModelSlug",
      message: errors.selectedModelSlug,
    });
  }

  if (payload.customerDetails.name.trim().length === 0) {
    errors.name = "Enter your full name so the sales team knows who to contact.";
    issues.push({ step: "details", field: "name", message: errors.name });
  }

  if (payload.customerDetails.email.trim().length === 0) {
    errors.email = "Enter your email address.";
    issues.push({ step: "details", field: "email", message: errors.email });
  } else if (!emailPattern.test(payload.customerDetails.email.trim())) {
    errors.email = "Enter a valid email address, for example name@example.com.";
    issues.push({ step: "details", field: "email", message: errors.email });
  }

  if (payload.customerDetails.phone.trim().length === 0) {
    errors.phone = "Enter a phone number so the sales team can reach you.";
    issues.push({ step: "details", field: "phone", message: errors.phone });
  }

  if (payload.customerDetails.enquiryType.trim().length === 0) {
    errors.enquiryType =
      "Choose whether this is an enquiry, quote request, or order enquiry.";
    issues.push({
      step: "details",
      field: "enquiryType",
      message: errors.enquiryType,
    });
  }

  return {
    errors,
    issues,
    isValid: Object.keys(errors).length === 0,
  };
}
