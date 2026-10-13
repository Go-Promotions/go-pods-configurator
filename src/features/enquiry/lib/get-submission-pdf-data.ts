import { configuratorApi, ConfiguratorApiError } from "@/lib/configurator-api";
import type { EnquiryType } from "@/types/configurator";

export interface SubmissionPdfData {
  reference: string;
  submittedAt: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    postcode: string | null;
    notes: string | null;
    enquiryType: EnquiryType;
    marketingConsent: boolean;
  };
  model: {
    name: string;
    slug: string;
    availabilityNotice: string | null;
  };
  pricing: {
    basePrice: number;
    optionsTotal: number;
    totalPrice: number;
  };
  weights: {
    baseMiro: number;
    addedOptionWeight: number;
    updatedMiro: number;
  };
  optionsByCategory: Array<{
    categoryName: string;
    items: Array<{
      title: string;
      slug: string;
      price: number;
      weight: number;
      quantity: number;
      sortOrder: number;
    }>;
  }>;
}

export async function getSubmissionPdfData(configurationId: string, reference: string): Promise<SubmissionPdfData | null> {
  try {
    return await configuratorApi<SubmissionPdfData>(`configurations/${encodeURIComponent(configurationId)}?reference=${encodeURIComponent(reference)}`);
  } catch (error) {
    if (error instanceof ConfiguratorApiError && error.status === 404) return null;
    throw error;
  }
}
