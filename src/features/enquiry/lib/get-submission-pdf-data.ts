import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { getHistoricalModelAvailabilityNotice } from "@/features/configurator/lib/model-availability";
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

export async function getSubmissionPdfData(
  configurationId: string,
  reference: string,
): Promise<SubmissionPdfData | null> {
  const supabase = createServiceRoleSupabaseClient();

  const configurationResult = await supabase
    .from("configurations")
    .select("*")
    .eq("id", configurationId)
    .eq("public_reference", reference)
    .eq("status", "submitted")
    .single();

  if (configurationResult.error || !configurationResult.data) {
    return null;
  }

  const configuration = configurationResult.data;

  const [modelResult, enquiryResult, itemsResult] = await Promise.all([
    supabase
      .from("models")
      .select("id, name, slug, active, availability, selectable")
      .eq("id", configuration.model_id)
      .single(),
    supabase
      .from("enquiries")
      .select("*")
      .eq("configuration_id", configuration.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .single(),
    supabase
      .from("configuration_items")
      .select("*")
      .eq("configuration_id", configuration.id)
      .order("sort_order", { ascending: true }),
  ]);

  if (
    modelResult.error ||
    !modelResult.data ||
    enquiryResult.error ||
    !enquiryResult.data ||
    itemsResult.error
  ) {
    return null;
  }

  const optionsByCategoryMap = new Map<
    string,
    SubmissionPdfData["optionsByCategory"][number]["items"]
  >();

  for (const item of itemsResult.data ?? []) {
    const categoryName = item.category_name_snapshot ?? "Selected options";
    const categoryItems = optionsByCategoryMap.get(categoryName) ?? [];

    categoryItems.push({
      title: item.option_title_snapshot,
      slug: item.option_slug_snapshot,
      price: Number(item.price_snapshot),
      weight: Number(item.weight_snapshot),
      quantity: item.quantity,
      sortOrder: item.sort_order,
    });

    optionsByCategoryMap.set(categoryName, categoryItems);
  }

  const optionsByCategory = [...optionsByCategoryMap.entries()]
    .map(([categoryName, items]) => ({
      categoryName,
      items: items.sort((a, b) => a.sortOrder - b.sortOrder),
    }))
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName));

  return {
    reference: configuration.public_reference,
    submittedAt: enquiryResult.data.created_at ?? configuration.created_at,
    customer: {
      name: enquiryResult.data.name,
      email: enquiryResult.data.email,
      phone: enquiryResult.data.phone,
      postcode: enquiryResult.data.postcode,
      notes: enquiryResult.data.notes,
      enquiryType: enquiryResult.data.enquiry_type,
      marketingConsent: enquiryResult.data.marketing_consent,
    },
    model: {
      name: modelResult.data.name,
      slug: modelResult.data.slug,
      availabilityNotice: getHistoricalModelAvailabilityNotice({
        name: modelResult.data.name,
        isActive: modelResult.data.active,
        availability: modelResult.data.availability,
        selectable: modelResult.data.selectable,
      }),
    },
    pricing: {
      basePrice: Number(configuration.base_price_snapshot),
      optionsTotal: Number(configuration.options_total_snapshot),
      totalPrice: Number(configuration.total_price_snapshot),
    },
    weights: {
      baseMiro: Number(configuration.base_miro_snapshot),
      addedOptionWeight: Number(configuration.option_weight_total_snapshot),
      updatedMiro: Number(configuration.total_miro_snapshot),
    },
    optionsByCategory,
  };
}
