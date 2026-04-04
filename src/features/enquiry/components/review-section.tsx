import { formatPrice, formatWeightKg } from "@/features/configurator/lib/formatters";
import type {
  ConfiguratorModel,
  ConfiguratorStep,
  ConfiguratorSubmissionResult,
  ConfiguratorValidationErrors,
  ConfiguratorSummary,
  CustomerDetailsDraft,
} from "@/types/configurator";

interface ReviewSectionProps {
  selectedModel: ConfiguratorModel | null;
  summary: ConfiguratorSummary;
  customerDetails: CustomerDetailsDraft;
  validationErrors: ConfiguratorValidationErrors;
  submissionResult: ConfiguratorSubmissionResult | null;
  isSubmitting: boolean;
  onSubmit: () => void;
  onGoToStep: (step: ConfiguratorStep) => void;
}

const enquiryTypeLabels: Record<CustomerDetailsDraft["enquiryType"], string> = {
  general_enquiry: "General enquiry",
  request_quote: "Request a formal quotation",
  proceed_to_order: "Proceed with an order",
};

export function ReviewSection({
  selectedModel,
  summary,
  customerDetails,
  validationErrors,
  submissionResult,
  isSubmitting,
  onSubmit,
  onGoToStep,
}: ReviewSectionProps) {
  if (submissionResult?.status === "success") {
    return (
      <div className="grid gap-5">
        <div className="rounded-[1.5rem] border border-[var(--color-accent)] bg-[#f2f5ef] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
            Enquiry submitted
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight">
            Thank you. A member of the sales team will get in touch shortly.
          </h3>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted-foreground)]">
            Your reference is <span className="font-semibold text-[var(--color-foreground)]">{submissionResult.reference}</span>.
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted-foreground)]">
            We have saved your configuration and enquiry details successfully.
          </p>
          {submissionResult.emailDelivery.status !== "sent" ? (
            <div className="mt-4 rounded-2xl border border-[#b58a4b] bg-[#fff7eb] p-4 text-sm leading-6 text-[#7a5722]">
              {submissionResult.emailDelivery.message}
            </div>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={`/api/configurations/${submissionResult.configurationId}/pdf?reference=${encodeURIComponent(submissionResult.reference)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"
            >
              Download your configuration PDF
            </a>
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted-foreground)]">
            Open the PDF when you are ready. It is generated on demand from the
            saved submission.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {validationErrors.form ? (
        <div className="rounded-[1.5rem] border border-[var(--color-danger)] bg-[rgba(141,79,59,0.08)] p-5 text-sm leading-6 text-[var(--color-danger)]">
          {validationErrors.form}
        </div>
      ) : null}

      {(validationErrors.selectedModelSlug ||
        validationErrors.name ||
        validationErrors.email ||
        validationErrors.phone ||
        validationErrors.enquiryType) ? (
        <div className="rounded-[1.5rem] border border-[var(--color-danger)] bg-white p-5">
          <p className="text-sm font-semibold text-[var(--color-danger)]">
            Please fix the highlighted details before submitting.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {validationErrors.selectedModelSlug ? (
              <button
                type="button"
                onClick={() => onGoToStep("model")}
                className="rounded-full border border-[var(--color-danger)] px-4 py-2 text-sm font-semibold text-[var(--color-danger)]"
              >
                Go to Step 1: Model
              </button>
            ) : null}
            {validationErrors.name ||
            validationErrors.email ||
            validationErrors.phone ||
            validationErrors.enquiryType ? (
              <button
                type="button"
                onClick={() => onGoToStep("details")}
                className="rounded-full border border-[var(--color-danger)] px-4 py-2 text-sm font-semibold text-[var(--color-danger)]"
              >
                Go to Step 4: Your details
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h3 className="text-lg font-semibold tracking-tight">Configuration</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <ReviewCard
            label="Selected model"
            value={selectedModel?.name ?? "No model selected"}
          />
          <ReviewCard
            label="Base price"
            value={formatPrice(summary.basePrice)}
          />
          <ReviewCard
            label="Options total"
            value={formatPrice(summary.optionsTotal)}
          />
          <ReviewCard
            label="Running total"
            value={formatPrice(summary.runningTotal)}
          />
          <ReviewCard
            label="Added option weight"
            value={formatWeightKg(summary.totalOptionWeight)}
          />
          <ReviewCard
            label="Updated MiRO"
            value={
              summary.updatedMiro === null
                ? "Awaiting model"
                : formatWeightKg(summary.updatedMiro)
            }
          />
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h3 className="text-lg font-semibold tracking-tight">Selected options</h3>
        {summary.selectedOptions.length > 0 ? (
          <div className="mt-4 space-y-3">
            {summary.selectedOptions.map((option) => (
              <div
                key={option.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-4 text-sm"
              >
                <div>
                  <p className="font-medium">{option.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]">
                    {option.scope}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(option.price)}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {formatWeightKg(option.weight)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-white p-4 text-sm text-[var(--color-muted-foreground)]">
            No options selected.
          </div>
        )}
      </div>

      <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h3 className="text-lg font-semibold tracking-tight">Your details</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <ReviewCard label="Name" value={customerDetails.name || "Not provided"} />
          <ReviewCard
            label="Email"
            value={customerDetails.email || "Not provided"}
          />
          <ReviewCard
            label="Phone"
            value={customerDetails.phone || "Not provided"}
          />
          <ReviewCard
            label="Postcode"
            value={customerDetails.postcode || "Not provided"}
          />
          <ReviewCard
            label="How would you like to proceed?"
            value={enquiryTypeLabels[customerDetails.enquiryType]}
          />
          <ReviewCard
            label="Newsletter sign-up"
            value={customerDetails.marketingConsent ? "Yes" : "No"}
          />
        </div>
        <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-white p-4 text-sm">
          <p className="font-medium">Notes</p>
          <p className="mt-2 leading-6 text-[var(--color-muted-foreground)]">
            {customerDetails.notes || "No notes added."}
          </p>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-dashed border-[var(--color-border-strong)] bg-white p-5 text-sm leading-6 text-[var(--color-muted-foreground)]">
        Please review the above information before submitting.
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="inline-flex items-center rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--color-border-strong)]"
        >
          {isSubmitting ? "Submitting enquiry..." : "Submit enquiry"}
        </button>
        {isSubmitting ? (
          <p className="self-center text-sm text-[var(--color-muted-foreground)]">
            Please wait while we save your configuration.
          </p>
        ) : null}
      </div>
    </div>
  );
}

interface ReviewCardProps {
  label: string;
  value: string;
}

function ReviewCard({ label, value }: ReviewCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 text-sm">
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]">
        {label}
      </p>
      <p className="mt-2 font-medium text-[var(--color-foreground)]">{value}</p>
    </div>
  );
}
