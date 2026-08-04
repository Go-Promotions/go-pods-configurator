export type CatalogueSource = "supabase" | "demo";

export type ModelAvailability =
  | "available"
  | "low_stock"
  | "sold_out"
  | "discontinued";

export type OptionScope = "accessory" | "styling";

export type EnquiryType = "general_enquiry" | "request_quote" | "proceed_to_order";
export type ConfiguratorStep =
  | "model"
  | "accessories"
  | "styling"
  | "details"
  | "review";

export interface ModelSpecItem {
  id: string;
  sectionLabel: string;
  itemLabel: string;
  itemValue: string;
  iconPath: string | null;
  sortOrder: number;
}

export interface ModelImage {
  id: string;
  imagePath: string;
  altText: string;
  sortOrder: number;
}

export interface ConfiguratorModel {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  imagePath: string | null;
  images: ModelImage[];
  basePrice: number;
  baseMiro: number;
  isActive: boolean;
  availability: ModelAvailability;
  selectable: boolean;
  recommendationEligible: boolean;
  sortOrder: number;
  specs: ModelSpecItem[];
}

export interface OptionImage {
  id: string;
  imagePath: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ConfiguratorOption {
  id: string;
  categoryId: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  primaryImageUrl: string | null;
  price: number;
  weight: number;
  isActive: boolean;
  sortOrder: number;
  scope: OptionScope;
  appliesToAllModels: boolean;
  compatibleModelSlugs: string[];
  includedModelSlugs: string[];
  includedOptionIds: string[];
  images: OptionImage[];
}

export interface OptionCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  scope: OptionScope;
  options: ConfiguratorOption[];
}

export interface ConfiguratorCatalogue {
  source: CatalogueSource;
  models: ConfiguratorModel[];
  optionCategories: OptionCategory[];
}

export interface ConfiguratorSummary {
  selectedModelName: string | null;
  selectedModelSlug: string | null;
  basePrice: number;
  selectedOptions: Array<{
    id: string;
    title: string;
    scope: OptionScope;
    price: number;
    weight: number;
  }>;
  optionsTotal: number;
  runningTotal: number;
  totalOptionWeight: number;
  updatedMiro: number | null;
  remainingPayload: number | null;
}

export interface CustomerDetailsDraft {
  name: string;
  email: string;
  phone: string;
  postcode: string;
  notes: string;
  marketingConsent: boolean;
  enquiryType: EnquiryType;
}

export interface ConfiguratorDraftState {
  currentStep: ConfiguratorStep;
  selectedModelSlug: string | null;
  selectedOptionIds: string[];
  customerDetails: CustomerDetailsDraft;
}

export interface ConfiguratorInitialSelections {
  currentStep?: ConfiguratorStep;
  selectedModelSlug?: string | null;
  selectedOptionIds?: string[];
}

export interface ConfiguratorSubmissionPayload {
  selectedModelSlug: string | null;
  selectedOptionIds: string[];
  customerDetails: CustomerDetailsDraft;
}

export interface ConfiguratorValidationErrors {
  selectedModelSlug?: string;
  name?: string;
  email?: string;
  phone?: string;
  enquiryType?: string;
  form?: string;
}

export interface ConfiguratorSubmissionSuccess {
  status: "success";
  reference: string;
  configurationId: string;
  emailDelivery:
    | { status: "sent" }
    | { status: "partial_failure"; message: string }
    | { status: "failed"; message: string };
}

export interface ConfiguratorSubmissionFailure {
  status: "error";
  errors: ConfiguratorValidationErrors;
}

export type ConfiguratorSubmissionResult =
  | ConfiguratorSubmissionSuccess
  | ConfiguratorSubmissionFailure;

export interface ConfiguratorValidationIssue {
  step: ConfiguratorStep;
  message: string;
  field?: keyof ConfiguratorValidationErrors;
}
