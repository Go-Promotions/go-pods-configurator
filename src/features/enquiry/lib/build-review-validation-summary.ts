import type {
  ConfiguratorValidationErrors,
  ConfiguratorValidationIssue,
} from "@/types/configurator";

export function buildReviewValidationSummary(
  errors: ConfiguratorValidationErrors,
): ConfiguratorValidationIssue[] {
  const issues: ConfiguratorValidationIssue[] = [];

  if (errors.selectedModelSlug) {
    issues.push({
      step: "model",
      field: "selectedModelSlug",
      message: errors.selectedModelSlug,
    });
  }

  if (errors.name) {
    issues.push({ step: "details", field: "name", message: errors.name });
  }

  if (errors.email) {
    issues.push({ step: "details", field: "email", message: errors.email });
  }

  if (errors.phone) {
    issues.push({ step: "details", field: "phone", message: errors.phone });
  }

  if (errors.enquiryType) {
    issues.push({
      step: "details",
      field: "enquiryType",
      message: errors.enquiryType,
    });
  }

  return issues;
}
