"use client";

import { startTransition, useEffect, useRef, useState, useReducer } from "react";

import { CustomerDetailsSection } from "@/features/enquiry/components/customer-details-section";
import { clearSubmissionAttempt, getSubmissionAttempt, type SubmissionAttempt } from "@/features/enquiry/lib/submission-attempt";
import { submitConfiguratorEnquiry } from "@/features/enquiry/actions/submit-configurator-enquiry";
import { ReviewSection } from "@/features/enquiry/components/review-section";
import { buildReviewValidationSummary } from "@/features/enquiry/lib/build-review-validation-summary";
import { buildConfiguratorSummary } from "@/features/configurator/lib/build-configurator-summary";
import {
  flattenCatalogueOptions,
  findSelectedModel,
} from "@/features/configurator/lib/configurator-compatibility";
import { getUpsellSuggestions } from "@/features/configurator/lib/upsell-suggestions";
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
import { UpsellSuggestionsSection } from "./upsell-suggestions-section";

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
  const pendingSubmission = useRef<SubmissionAttempt | null>(null);
  const submissionInFlight = useRef(false);
  const isMounted = useRef(true);
  const activeStepTopRef = useRef<HTMLDivElement | null>(null);
  const hasRenderedInitialStep = useRef(false);

  const selectedModel = findSelectedModel(catalogue.models, state.selectedModelSlug);
  const selectedOptions = allOptions.filter((option) =>
    state.selectedOptionIds.includes(option.id),
  );
  const summary = buildConfiguratorSummary({
    model: selectedModel,
    selectedOptions,
  });
  const upsellSuggestions = getUpsellSuggestions({
    options: allOptions,
    selectedModel,
    selectedOptionIds: state.selectedOptionIds,
  });
  const canGoNext = canMoveToNextStep(state);
  const activeIndex = configuratorSteps.findIndex(
    (step) => step.id === state.currentStep,
  );
  const furthestAvailableStepIndex = getFurthestAvailableStepIndex(state);
  const isFinalStep = activeIndex === configuratorSteps.length - 1;
  const hasSubmittedSuccessfully = submissionResult?.status === "success";

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!hasRenderedInitialStep.current) {
      hasRenderedInitialStep.current = true;
      return;
    }

    window.requestAnimationFrame(() => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      activeStepTopRef.current?.scrollIntoView({
        block: "start",
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    });
  }, [state.currentStep]);

  function handleSetStep(step: (typeof configuratorSteps)[number]["id"]) {
    if (isSubmitting) {
      return;
    }

    dispatch({ type: "set-step", step });
  }

  function handleSubmit() {
    if (submissionInFlight.current) {
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

    // Lock synchronously, before the asynchronous digest or React state update.
    submissionInFlight.current = true;
    setIsSubmitting(true);
    setValidationErrors({});
    setSubmissionResult(null);

    startTransition(async () => {
      let result: ConfiguratorSubmissionResult;
      try {
        pendingSubmission.current = await getSubmissionAttempt(pendingSubmission.current, payload);
        if (!isMounted.current) return;
        result = await submitConfiguratorEnquiry(payload, pendingSubmission.current.id);
      } catch {
        result = {
          status: "error",
          errors: { form: "We could not confirm your enquiry. Please try again." },
        };
      }
      // Keep the retry ID if navigation prevented the confirmation being shown.
      if (!isMounted.current) return;
      if (result.status === "error" && result.errors.form && !pendingSubmission.current?.persisted) {
        result = {
          ...result,
          errors: { ...result.errors, form: `${result.errors.form} Please retry without reloading this page.` },
        };
      }
      if (result.status === "success" && pendingSubmission.current) {
        clearSubmissionAttempt(pendingSubmission.current);
        pendingSubmission.current = null;
      }

      setSubmissionResult(result);
      setValidationErrors(result.status === "error" ? result.errors : {});
      submissionInFlight.current = false;
      setIsSubmitting(false);

      if (result.status === "error") {
        const nextIssues = buildReviewValidationSummary(result.errors);
        if (nextIssues[0]) {
          dispatch({ type: "set-step", step: nextIssues[0].step });
        }
      }
    });
  }

  function handleGoBack(onSuccessfulStepChange?: () => void) {
    if (isSubmitting || activeIndex <= 0) {
      return;
    }

    dispatch({ type: "go-back" });
    onSuccessfulStepChange?.();
  }

  function handleGoNext(onSuccessfulStepChange?: () => void) {
    if (isSubmitting || !canGoNext || isFinalStep) {
      return;
    }

    dispatch({ type: "go-next" });
    onSuccessfulStepChange?.();
  }

  const renderSummaryNavigationControls = ({
    collapseMobileSummary,
  }: {
    collapseMobileSummary?: () => void;
  }) => (
    <div className="space-y-3">
      {activeIndex === 0 && !canGoNext ? (
        <p className="text-sm leading-5 text-[var(--color-muted-foreground)]">
          Select a model to continue.
        </p>
      ) : null}
      {state.currentStep === "details" && !canGoNext ? (
        <p className="text-sm leading-5 text-[var(--color-muted-foreground)]">
          Add your name, email and phone number to continue.
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {activeIndex > 0 ? (
          <button
            type="button"
            onClick={() => handleGoBack(collapseMobileSummary)}
            disabled={isSubmitting}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--color-border-strong)] px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>
        ) : null}
        {isFinalStep ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || hasSubmittedSuccessfully}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--color-border-strong)] sm:col-span-1"
          >
            {hasSubmittedSuccessfully
              ? "Submitted"
              : isSubmitting
                ? "Submitting enquiry..."
                : "Submit enquiry"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleGoNext(collapseMobileSummary)}
            disabled={!canGoNext || isSubmitting}
            className={[
              "inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--color-border-strong)]",
              activeIndex === 0 ? "sm:col-span-2 lg:col-span-1 xl:col-span-2" : "",
            ].join(" ")}
          >
            Continue
          </button>
        )}
      </div>
      {isSubmitting ? (
        <p className="text-sm leading-5 text-[var(--color-muted-foreground)]">
          Please wait while we save your configuration.
        </p>
      ) : null}
    </div>
  );

  return (
    <div className="grid gap-5 pb-72 md:pb-64 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:pb-0">
      <div className="space-y-5">
        <nav className="hidden flex-col gap-4 rounded-[1.5rem] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-soft)] sm:p-5 md:flex">
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

        <div ref={activeStepTopRef} className="scroll-mt-5" />

        {state.currentStep === "model" ? (
          <ConfiguratorStepSection
            stepNumber={1}
            title="Choose your Go-Pod model"
            description="Select your Go-Pod model below, then use the summary action area to continue."
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
                  models: catalogue.models,
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
          >
            <div className="space-y-6">
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
              <UpsellSuggestionsSection
                options={upsellSuggestions}
                allOptions={allOptions}
                selectedModel={selectedModel}
                selectedOptionIds={state.selectedOptionIds}
                isLocked={isSubmitting}
                onToggleOption={(optionId) =>
                  dispatch({ type: "toggle-option", optionId, options: allOptions })
                }
              />
            </div>
          </ConfiguratorStepSection>
        ) : null}

        {state.currentStep === "details" ? (
          <ConfiguratorStepSection
            stepNumber={4}
            title="Your details"
            description="Enter your details below to save your configuration, download a PDF copy and receive another copy via email for your records. You can also request a formal quotation from our sales team, or if you’re happy with everything, you can proceed straight to ordering!"
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
          >
            <ReviewSection
              selectedModel={selectedModel}
              summary={summary}
              customerDetails={state.customerDetails}
              validationErrors={validationErrors}
              submissionResult={submissionResult}
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
        renderActionArea={renderSummaryNavigationControls}
        isLocked={isSubmitting}
        onToggleOption={(optionId) =>
          dispatch({ type: "toggle-option", optionId, options: allOptions })
        }
      />
    </div>
  );
}
