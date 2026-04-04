"use server";

import { flattenCatalogueOptions, findSelectedModel, isOptionCompatibleWithModel } from "@/features/configurator/lib/configurator-compatibility";
import { buildConfiguratorSummary } from "@/features/configurator/lib/build-configurator-summary";
import { getConfiguratorCatalogue } from "@/features/configurator/lib/get-configurator-catalogue";
import { validateConfiguratorSubmission } from "@/features/enquiry/lib/validate-configurator-submission";
import { sendSubmissionEmails } from "@/features/enquiry/lib/send-submission-emails";
import { hasPublicSupabaseEnv } from "@/lib/supabase/config";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import type {
  ConfiguratorSubmissionPayload,
  ConfiguratorSubmissionResult,
} from "@/types/configurator";

export async function submitConfiguratorEnquiry(
  payload: ConfiguratorSubmissionPayload,
): Promise<ConfiguratorSubmissionResult> {
  const validation = validateConfiguratorSubmission(payload);

  if (!validation.isValid) {
    return {
      status: "error",
      errors: validation.errors,
    };
  }

  if (!hasPublicSupabaseEnv()) {
    return {
      status: "error",
      errors: {
        form: "Submission is not available yet because Supabase environment variables are not configured.",
      },
    };
  }

  try {
    const catalogue = await getConfiguratorCatalogue();

    if (catalogue.source !== "supabase") {
      return {
        status: "error",
        errors: {
          form: "Submission is only available when the live Supabase catalogue is configured.",
        },
      };
    }

    const selectedModel = findSelectedModel(
      catalogue.models,
      payload.selectedModelSlug,
    );

    if (!selectedModel) {
      return {
        status: "error",
        errors: {
          selectedModelSlug: "The selected model could not be found.",
        },
      };
    }

    const allOptions = flattenCatalogueOptions(catalogue.optionCategories);
    const uniqueSelectedOptionIds = [...new Set(payload.selectedOptionIds)];
    const selectedOptions = uniqueSelectedOptionIds.map((optionId) =>
      allOptions.find((option) => option.id === optionId) ?? null,
    );

    if (selectedOptions.some((option) => option === null)) {
      return {
        status: "error",
        errors: {
          form: "One or more selected options are no longer available. Please review the configuration and submit again.",
        },
      };
    }

    const resolvedSelectedOptions = selectedOptions.filter(
      (option): option is NonNullable<typeof option> => option !== null,
    );

    const hasIncompatibleOption = resolvedSelectedOptions.some(
      (option) => !isOptionCompatibleWithModel(option, selectedModel.slug),
    );

    if (hasIncompatibleOption) {
      return {
        status: "error",
        errors: {
          form: "One or more selected options are not compatible with the chosen model. Please review your configuration and try again.",
        },
      };
    }

    const summary = buildConfiguratorSummary({
      model: selectedModel,
      selectedOptions: resolvedSelectedOptions,
    });

    if (summary.updatedMiro === null) {
      return {
        status: "error",
        errors: {
          form: "We could not calculate the final MiRO for this configuration. Please review the selection and try again.",
        },
      };
    }

    const supabase = createServiceRoleSupabaseClient();
    const reference = buildPublicReference();

    const configurationInsert = await supabase
      .from("configurations")
      .insert({
        public_reference: reference,
        model_id: selectedModel.id,
        status: "submitted",
        currency_code: "GBP",
        base_price_snapshot: summary.basePrice,
        options_total_snapshot: summary.optionsTotal,
        total_price_snapshot: summary.runningTotal,
        base_miro_snapshot: selectedModel.baseMiro,
        option_weight_total_snapshot: summary.totalOptionWeight,
        total_miro_snapshot: summary.updatedMiro ?? selectedModel.baseMiro,
      })
      .select("id, public_reference")
      .single();

    if (configurationInsert.error || !configurationInsert.data) {
      return {
        status: "error",
        errors: {
          form: "We could not save the configuration. Please try again.",
        },
      };
    }

    if (resolvedSelectedOptions.length > 0) {
      const itemRows = resolvedSelectedOptions.map((option) => {
        const categoryName =
          catalogue.optionCategories.find(
            (category) => category.id === option.categoryId,
          )?.name ?? null;

        return {
          configuration_id: configurationInsert.data.id,
          option_id: option.id,
          option_title_snapshot: option.title,
          option_slug_snapshot: option.slug,
          category_name_snapshot: categoryName,
          quantity: 1,
          price_snapshot: option.price,
          weight_snapshot: option.weight,
          sort_order: option.sortOrder,
        };
      });

      if (itemRows.some((row) => row.category_name_snapshot === null)) {
        await supabase
          .from("configurations")
          .delete()
          .eq("id", configurationInsert.data.id);

        return {
          status: "error",
          errors: {
            form: "One or more selected options could not be matched to the current catalogue. Please review the configuration and try again.",
          },
        };
      }

      const configurationItemsInsert = await supabase
        .from("configuration_items")
        .insert(itemRows);

      if (configurationItemsInsert.error) {
        await supabase
          .from("configurations")
          .delete()
          .eq("id", configurationInsert.data.id);

        return {
          status: "error",
          errors: {
            form: "We could not save the selected options. Please try again.",
          },
        };
      }
    }

    const enquiryInsert = await supabase.from("enquiries").insert({
      configuration_id: configurationInsert.data.id,
      enquiry_type: payload.customerDetails.enquiryType,
      name: payload.customerDetails.name.trim(),
      email: payload.customerDetails.email.trim(),
      phone: payload.customerDetails.phone.trim(),
      postcode: nullIfEmpty(payload.customerDetails.postcode),
      notes: nullIfEmpty(payload.customerDetails.notes),
      marketing_consent: payload.customerDetails.marketingConsent,
      source_name: null,
      source_medium: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null,
    });

    if (enquiryInsert.error) {
      await supabase
        .from("configuration_items")
        .delete()
        .eq("configuration_id", configurationInsert.data.id);
      await supabase
        .from("configurations")
        .delete()
        .eq("id", configurationInsert.data.id);

      return {
        status: "error",
        errors: {
          form: "We could not save the enquiry details. Please try again.",
        },
      };
    }

    return {
      status: "success",
      reference: configurationInsert.data.public_reference,
      configurationId: configurationInsert.data.id,
      emailDelivery: await sendSubmissionEmails({
        configurationId: configurationInsert.data.id,
        reference: configurationInsert.data.public_reference,
      }),
    };
  } catch {
    return {
      status: "error",
      errors: {
        form: "Something unexpected went wrong while sending your enquiry. Please try again.",
      },
    };
  }
}

function buildPublicReference() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const suffix = crypto.randomUUID().slice(0, 8).toUpperCase();

  return `GP-${timestamp}-${suffix}`;
}

function nullIfEmpty(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
