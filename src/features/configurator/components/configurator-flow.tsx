"use client";

import { startTransition, useState, useReducer } from "react";

import { CustomerDetailsSection } from "@/features/enquiry/components/customer-details-section";
import { submitConfiguratorEnquiry } from "@/features/enquiry/actions/submit-configurator-enquiry";
import { ReviewSection } from "@/features/enquiry/components/review-section";
import { buildReviewValidationSummary } from "@/features/enquiry/lib/build-review-validation-summary";
import { buildConfiguratorSummary } from "@/features/configurator/lib/build-configurator-summary";
import {
  flattenCatalogueOptions,
  findSelectedModel,
} from "@/features/configurator/lib/configurator-compatibility";
import {
  canMoveToNextStep,
  configuratorReducer,
  createInitialConfiguratorDraftState,
  getFurthestAvailableStepIndex,
} from "@/features/configurator/lib/configurator-state";
import { configuratorSteps } from "@/features/configurator/lib/configurator-steps";
import { validateConfiguratorSubmission } from "@/features/enquiry/lib/validate-configurator-submission";
import type {
  ConfiguratorCatalogue,
  ConfiguratorInitialSelections,
  ConfiguratorSubmissionResult,
  ConfiguratorValidationErrors,
} from "@/types/configurator";

import { ConfiguratorStepSection } from "./configurator-step-section";
import { ModelSelectionSection } from "./model-selection-section";
import { OptionsSection } from "./options-section";
import { SummarySidebar } from "./summary-sidebar";

interface ConfiguratorFlowProps {
  catalogue: ConfiguratorCatalogue;
  initialSelections?: ConfiguratorInitialSelections | null;
}

const STEP_NAVIGATION_LIST_CLASS = "grid gap-3 text-sm md:grid-cols-5";
const STEP_NAVIGATION_ITEM_CLASS =
  "w-full rounded-2xl border px-3 py-3 text-left transition md:min-h-[92px]";

export function ConfiguratorFlow({
  catalogue,
  initialSelections = null,
}: ConfiguratorFlowProps) {
  const allOptions = flattenCatalogueOptions(catalogue.optionCategories);
  const [state, dispatch] = useReducer(
    configuratorReducer,
    initialSelections ?? undefined,
    createInitialConfiguratorDraftState,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] =
    useState<ConfiguratorValidationErrors>({});
  const [submissionResult, setSubmissionResult] =
    useState<ConfiguratorSubmissionResult | null>(null);

  const selectedModel = findSelectedModel(catalogue.models, state.selectedModelSlug);
  const selectedOptions = allOptions.filter((option) =>
    state.selectedOptionIds.includes(option.id),
  );
  const summary = buildConfiguratorSummary({
    model: selectedModel,
    selectedOptions,
  });
  const canGoNext = canMoveToNextStep(state);
  const activeIndex = configuratorSteps.findIndex(
    (step) => step.id === state.currentStep,
  );
  const furthestAvailableStepIndex = getFurthestAvailableStepIndex(state);

  function handleSetStep(step: (typeof configuratorSteps)[number]["id"]) {
    if (isSubmitting) {
      return;
    }

    dispatch({ type: "set-step", step });
  }

  function handleSubmit() {
    if (isSubmitting) {
      return;
    }

    const payload = {
      selectedModelSlug: state.selectedModelSlug,
      selectedOptionIds: state.selectedOptionIds,
      customerDetails: state.customerDetails,
    };

    const validation = validateConfiguratorSubmission(payload);

    if (!validation.isValid) {
      setSubmissionResult(null);
      setValidationErrors(validation.errors);
      const firstIssue = validation.issues[0];
      if (firstIssue) {
        dispatch({ type: "set-step", step: firstIssue.step });
      }
      return;
    }

    setIsSubmitting(true);
    setValidationErrors({});
    setSubmissionResult(null);

    startTransition(async () => {
      const result = await submitConfiguratorEnquiry(payload);

      setSubmissionResult(result);
      setValidationErrors(result.status === "error" ? result.errors : {});
      setIsSubmitting(false);

      if (result.status === "error") {
        const nextIssues = buildReviewValidationSummary(result.errors);
        if (nextIssues[0]) {
          dispatch({ type: "set-step", step: nextIssues[0].step });
        }
      }
    });
  }

  const stepFooterNavigationControls = (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => dispatch({ type: "go-back" })}
        disabled={activeIndex === 0 || isSubmitting}
        className="inline-flex items-center rounded-full border border-[var(--color-border-strong)] px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        Back
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "go-next" })}
        disabled={
          !canGoNext ||
          activeIndex === configuratorSteps.length - 1 ||
          isSubmitting
        }
        className="inline-flex items-center rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--color-border-strong)]"
      >
        Continue
      </button>
    </div>
  );

  return (
    <div className="grid gap-5 pb-28 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:pb-0">
      <div className="space-y-5">
        <nav className="flex flex-col gap-4 rounded-[1.5rem] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-soft)] sm:p-5">
          <ol className={STEP_NAVIGATION_LIST_CLASS}>
            {configuratorSteps.map((step, index) => {
              const isActive = step.id === state.currentStep;
              const isAvailable = index <= furthestAvailableStepIndex;

              return (
                <li key={step.id}>
                  <button
                    type="button"
                    onClick={() => handleSetStep(step.id)}
                    disabled={!isAvailable || isSubmitting}
                    className={[
                      STEP_NAVIGATION_ITEM_CLASS,
                      isActive
                        ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface)]",
                      !isAvailable ? "cursor-not-allowed opacity-50" : "hover:border-[var(--color-accent)]",
                    ].join(" ")}
                  >
                    <span className="font-mono text-xs text-[var(--color-muted-foreground)]">
                      0{step.stepNumber}
                    </span>
                    <p className="mt-2 text-sm font-medium leading-5 text-[var(--color-foreground)]">
                      {step.shortLabel}
                    </p>
                  </button>
                </li>
              );
            })}
          </ol>

        </nav>

        {state.currentStep === "model" ? (
          <ConfiguratorStepSection
            stepNumber={1}
            title="Choose your Go-Pod model"
            description="Select your Go-Pod model below, then click Continue to move to the next step."
            footer={stepFooterNavigationControls}
          >
            <ModelSelectionSection
              models={catalogue.models}
              selectedModelSlug={state.selectedModelSlug}
              errorMessage={validationErrors.selectedModelSlug}
              isLocked={isSubmitting}
              onSelectModel={(modelSlug) =>
                dispatch({
                  type: "select-model",
                  modelSlug,
                  options: allOptions,
                })
              }
            />
          </ConfiguratorStepSection>
        ) : null}

        {state.currentStep === "accessories" ? (
          <ConfiguratorStepSection
            stepNumber={2}
            title="Accessories & upgrades"
            description="Select the accessories and upgrades you’d like to add to your Go-Pod."
            footer={stepFooterNavigationControls}
          >
            <OptionsSection
              categories={catalogue.optionCategories}
              scope="accessory"
              emptyStateTitle="Accessory categories will appear here once catalogue data is available."
              selectedModel={selectedModel}
              selectedModelSlug={state.selectedModelSlug}
              selectedOptionIds={state.selectedOptionIds}
              isLocked={isSubmitting}
              enableSearch
              onApplyPackageSuggestion={(packageOptionId) =>
                dispatch({
                  type: "apply-package-suggestion",
                  packageOptionId,
                  options: allOptions,
                })
              }
              onToggleOption={(optionId) =>
                dispatch({ type: "toggle-option", optionId, options: allOptions })
              }
            />
          </ConfiguratorStepSection>
        ) : null}

        {state.currentStep === "styling" ? (
          <ConfiguratorStepSection
            stepNumber={3}
            title="Styling upgrades"
            description="Add a custom design, splash of colour or smart alloy wheels to your Go-Pod."
            footer={stepFooterNavigationControls}
          >
            <OptionsSection
              categories={catalogue.optionCategories}
              scope="styling"
              emptyStateTitle="Styling categories will appear here once catalogue data is available."
              selectedModel={selectedModel}
              selectedModelSlug={state.selectedModelSlug}
              selectedOptionIds={state.selectedOptionIds}
              isLocked={isSubmitting}
              onToggleOption={(optionId) =>
                dispatch({ type: "toggle-option", optionId, options: allOptions })
              }
            />
          </ConfiguratorStepSection>
        ) : null}

        {state.currentStep === "details" ? (
          <ConfiguratorStepSection
            stepNumber={4}
            title="Your details"
            description="Enter your details below to save your configuration, download a PDF copy and receive another copy via email for your records. You can also request a formal quotation from our sales team, or if you’re happy with everything, you can proceed straight to ordering!"
            footer={stepFooterNavigationControls}
          >
            <CustomerDetailsSection
              customerDetails={state.customerDetails}
              errors={{
                name: validationErrors.name,
                email: validationErrors.email,
                phone: validationErrors.phone,
                enquiryType: validationErrors.enquiryType,
              }}
              isLocked={isSubmitting}
              onFieldChange={(field, value) =>
                dispatch({
                  type: "update-customer-field",
                  field,
                  value,
                })
              }
            />
          </ConfiguratorStepSection>
        ) : null}

        {state.currentStep === "review" ? (
          <ConfiguratorStepSection
            stepNumber={5}
            title="Review & submit"
            description="Review your selected configuration to make sure you’re happy before finalising"
            footer={null}
          >
            <ReviewSection
              selectedModel={selectedModel}
              summary={summary}
              customerDetails={state.customerDetails}
              validationErrors={validationErrors}
              submissionResult={submissionResult}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onGoToStep={handleSetStep}
            />
          </ConfiguratorStepSection>
        ) : null}
      </div>

      <SummarySidebar
        summary={summary}
        selectedOptions={selectedOptions}
        allOptions={allOptions}
        selectedModel={selectedModel}
        selectedModelName={selectedModel?.name ?? null}
        isLocked={isSubmitting}
        onToggleOption={(optionId) =>
          dispatch({ type: "toggle-option", optionId, options: allOptions })
        }
      />
    </div>
  );
}
