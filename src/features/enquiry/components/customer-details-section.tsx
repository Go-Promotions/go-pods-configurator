import type { CustomerDetailsDraft } from "@/types/configurator";

const fieldClasses =
  "w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-accent)]";

interface CustomerDetailsSectionProps {
  customerDetails: CustomerDetailsDraft;
  onFieldChange: (
    field: keyof CustomerDetailsDraft,
    value: string | boolean,
  ) => void;
  errors?: Partial<
    Record<keyof Pick<CustomerDetailsDraft, "name" | "email" | "phone" | "enquiryType">, string>
  >;
  isLocked?: boolean;
}

const enquiryOptions: Array<{
  value: CustomerDetailsDraft["enquiryType"];
  label: string;
}> = [
  { value: "general_enquiry", label: "General enquiry" },
  { value: "request_quote", label: "Request a formal quotation" },
  { value: "proceed_to_order", label: "Proceed with an order" },
];

export function CustomerDetailsSection({
  customerDetails,
  onFieldChange,
  errors,
  isLocked = false,
}: CustomerDetailsSectionProps) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Full name
          <input
            className={`${fieldClasses} ${errors?.name ? "border-[var(--color-danger)]" : ""}`}
            type="text"
            name="name"
            placeholder="Customer full name"
            value={customerDetails.name}
            onChange={(event) => onFieldChange("name", event.target.value)}
            disabled={isLocked}
          />
          {errors?.name ? (
            <span className="text-sm text-[var(--color-danger)]">{errors.name}</span>
          ) : null}
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Email address
          <input
            className={`${fieldClasses} ${errors?.email ? "border-[var(--color-danger)]" : ""}`}
            type="email"
            name="email"
            placeholder="customer@example.com"
            value={customerDetails.email}
            onChange={(event) => onFieldChange("email", event.target.value)}
            disabled={isLocked}
          />
          {errors?.email ? (
            <span className="text-sm text-[var(--color-danger)]">{errors.email}</span>
          ) : null}
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Phone number
          <input
            className={`${fieldClasses} ${errors?.phone ? "border-[var(--color-danger)]" : ""}`}
            type="tel"
            name="phone"
            placeholder="Telephone number"
            value={customerDetails.phone}
            onChange={(event) => onFieldChange("phone", event.target.value)}
            disabled={isLocked}
          />
          {errors?.phone ? (
            <span className="text-sm text-[var(--color-danger)]">{errors.phone}</span>
          ) : null}
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Postcode
          <input
            className={fieldClasses}
            type="text"
            name="postcode"
            placeholder="Optional postcode"
            value={customerDetails.postcode}
            onChange={(event) => onFieldChange("postcode", event.target.value)}
            disabled={isLocked}
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium">
        Notes
        <textarea
          className={`${fieldClasses} min-h-32 resize-y`}
          name="notes"
          placeholder="Questions, timing, trade-in notes, or other context."
          value={customerDetails.notes}
          onChange={(event) => onFieldChange("notes", event.target.value)}
          disabled={isLocked}
        />
      </label>

      <div className="grid gap-4 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div>
          <p className="text-sm font-semibold">How would you like to proceed?</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {enquiryOptions.map((option) => (
            <label
              key={option.value}
              className={`flex items-start gap-3 rounded-2xl border bg-white p-4 text-sm ${
                errors?.enquiryType
                  ? "border-[var(--color-danger)]"
                  : "border-[var(--color-border)]"
              }`}
            >
              <input
                type="radio"
                name="enquiryType"
                value={option.value}
                checked={customerDetails.enquiryType === option.value}
                onChange={() => onFieldChange("enquiryType", option.value)}
                disabled={isLocked}
                className="mt-1 h-4 w-4 border-[var(--color-border)]"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {errors?.enquiryType ? (
          <span className="text-sm text-[var(--color-danger)]">
            {errors.enquiryType}
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-sm font-semibold">
            Would you like to sign up to our newsletter?
          </p>
        </div>
        <label className="inline-flex items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            checked={customerDetails.marketingConsent}
            onChange={(event) =>
              onFieldChange("marketingConsent", event.target.checked)
            }
            disabled={isLocked}
            className="h-4 w-4 rounded border-[var(--color-border)]"
          />
          Yes please - sign me up!
        </label>
      </div>
    </div>
  );
}
