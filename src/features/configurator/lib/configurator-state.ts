"use client";

import { filterCompatibleSelectedOptionIds } from "@/features/configurator/lib/configurator-compatibility";
import { getSelectedOptionIdsWithoutPackageDuplicates } from "@/features/configurator/lib/configurator-compatibility";
import { applySuggestedPackageSelection } from "@/features/configurator/lib/package-suggestions";
import {
  configuratorSteps,
  firstConfiguratorStep,
  lastConfiguratorStep,
} from "@/features/configurator/lib/configurator-steps";
import type {
  ConfiguratorDraftState,
  ConfiguratorInitialSelections,
  ConfiguratorOption,
  ConfiguratorStep,
  CustomerDetailsDraft,
} from "@/types/configurator";

export const initialCustomerDetailsDraft: CustomerDetailsDraft = {
  name: "",
  email: "",
  phone: "",
  postcode: "",
  notes: "",
  marketingConsent: false,
  enquiryType: "general_enquiry",
};

export function createInitialConfiguratorDraftState(
  initialSelections?: ConfiguratorInitialSelections,
): ConfiguratorDraftState {
  return {
    currentStep: initialSelections?.currentStep ?? firstConfiguratorStep,
    selectedModelSlug: initialSelections?.selectedModelSlug ?? null,
    selectedOptionIds: initialSelections?.selectedOptionIds ?? [],
    customerDetails: initialCustomerDetailsDraft,
  };
}

type ConfiguratorAction =
  | { type: "set-step"; step: ConfiguratorStep }
  | { type: "go-next" }
  | { type: "go-back" }
  | {
      type: "select-model";
      modelSlug: string;
      options: ConfiguratorOption[];
    }
  | { type: "toggle-option"; optionId: string; options: ConfiguratorOption[] }
  | {
      type: "apply-package-suggestion";
      packageOptionId: string;
      options: ConfiguratorOption[];
    }
  | {
      type: "update-customer-field";
      field: keyof CustomerDetailsDraft;
      value: string | boolean;
    };

export function configuratorReducer(
  state: ConfiguratorDraftState,
  action: ConfiguratorAction,
): ConfiguratorDraftState {
  switch (action.type) {
    case "set-step":
      return { ...state, currentStep: action.step };
    case "go-next":
      return {
        ...state,
        currentStep: getAdjacentStep(state.currentStep, "next"),
      };
    case "go-back":
      return {
        ...state,
        currentStep: getAdjacentStep(state.currentStep, "back"),
      };
    case "select-model":
      return {
        ...state,
        selectedModelSlug: action.modelSlug,
        selectedOptionIds: filterCompatibleSelectedOptionIds(
          state.selectedOptionIds,
          action.options,
          action.modelSlug,
        ),
      };
    case "toggle-option": {
      const isSelected = state.selectedOptionIds.includes(action.optionId);

      return {
        ...state,
        selectedOptionIds: isSelected
          ? state.selectedOptionIds.filter((optionId) => optionId !== action.optionId)
          : getSelectedOptionIdsWithoutPackageDuplicates(
              action.optionId,
              state.selectedOptionIds,
              action.options,
            ),
      };
    }
    case "apply-package-suggestion":
      return {
        ...state,
        selectedOptionIds: applySuggestedPackageSelection(
          action.packageOptionId,
          state.selectedOptionIds,
          action.options,
        ),
      };
    case "update-customer-field":
      return {
        ...state,
        customerDetails: {
          ...state.customerDetails,
          [action.field]: action.value,
        },
      };
    default:
      return state;
  }
}

export function canMoveToNextStep(state: ConfiguratorDraftState) {
  switch (state.currentStep) {
    case "model":
      return state.selectedModelSlug !== null;
    case "details":
      return (
        state.customerDetails.name.trim().length > 0 &&
        state.customerDetails.email.trim().length > 0 &&
        state.customerDetails.phone.trim().length > 0
      );
    default:
      return state.currentStep !== lastConfiguratorStep;
  }
}

export function getFurthestAvailableStepIndex(state: ConfiguratorDraftState) {
  if (state.selectedModelSlug === null) {
    return 0;
  }

  if (
    state.customerDetails.name.trim().length > 0 &&
    state.customerDetails.email.trim().length > 0 &&
    state.customerDetails.phone.trim().length > 0
  ) {
    return 4;
  }

  return 3;
}

function getAdjacentStep(
  currentStep: ConfiguratorStep,
  direction: "next" | "back",
): ConfiguratorStep {
  const index = configuratorSteps.findIndex((step) => step.id === currentStep);

  if (index === -1) {
    return firstConfiguratorStep;
  }

  if (direction === "next") {
    return configuratorSteps[Math.min(index + 1, configuratorSteps.length - 1)].id;
  }

  return configuratorSteps[Math.max(index - 1, 0)].id;
}
