import type {
  ConfiguratorModel,
  ModelAvailability,
} from "@/types/configurator";

const NEW_CONFIGURATION_AVAILABILITIES: readonly ModelAvailability[] = [
  "available",
  "low_stock",
];

const AVAILABILITY_SORT_ORDER: Record<ModelAvailability, number> = {
  available: 0,
  low_stock: 1,
  sold_out: 2,
  discontinued: 3,
};

export const MODEL_UNAVAILABLE_MESSAGE =
  "This Go-Pod model is no longer available.";

export function isModelSelectable(
  model: Pick<ConfiguratorModel, "availability" | "isActive" | "selectable">,
) {
  return (
    model.isActive &&
    model.selectable &&
    NEW_CONFIGURATION_AVAILABILITIES.includes(model.availability)
  );
}

export function isModelRecommendationEligible(
  model: Pick<
    ConfiguratorModel,
    "availability" | "isActive" | "recommendationEligible" | "selectable"
  >,
) {
  return isModelSelectable(model) && model.recommendationEligible;
}

export function sortModelsByAvailability(models: ConfiguratorModel[]) {
  return [...models].sort((left, right) => {
    const availabilityDifference =
      AVAILABILITY_SORT_ORDER[left.availability] -
      AVAILABILITY_SORT_ORDER[right.availability];

    return availabilityDifference || left.sortOrder - right.sortOrder;
  });
}

export function getModelAvailabilityLabel(availability: ModelAvailability) {
  switch (availability) {
    case "low_stock":
      return "Low stock";
    case "sold_out":
      return "Sold out";
    case "discontinued":
      return "Discontinued";
    default:
      return null;
  }
}

export function getModelSubmissionAvailabilityError(
  model: ConfiguratorModel | null,
) {
  if (!model) {
    return "The selected model could not be found.";
  }

  return isModelSelectable(model) ? null : MODEL_UNAVAILABLE_MESSAGE;
}

export function getHistoricalModelAvailabilityNotice(
  model: Pick<
    ConfiguratorModel,
    "availability" | "isActive" | "name" | "selectable"
  >,
) {
  if (isModelSelectable(model)) {
    return null;
  }

  const availabilityLabel =
    getModelAvailabilityLabel(model.availability)?.toLowerCase() ?? "unavailable";

  return `${model.name} is ${availabilityLabel} and is no longer available for new orders. This historical configuration and its original selections have not been changed.`;
}
