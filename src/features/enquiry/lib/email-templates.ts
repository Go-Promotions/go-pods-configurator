import { formatPrice, formatWeightKg } from "@/features/configurator/lib/formatters";
import { enquiryTypeLabels } from "@/features/enquiry/lib/enquiry-labels";
import type { SubmissionPdfData } from "@/features/enquiry/lib/get-submission-pdf-data";

interface TransactionalEmailContent {
  subject: string;
  htmlContent: string;
  textContent: string;
}

const EMAIL_BRAND_GREEN = "#39B54A";
const EMAIL_TEXT = "#1F2933";
const EMAIL_MUTED = "#52606D";
const EMAIL_BORDER = "#D9E2EC";
const EMAIL_PANEL = "#F8FBF8";

function buildEmailShell(args: {
  eyebrow: string;
  title: string;
  introHtml: string;
  bodyHtml: string;
  footerHtml?: string;
  headerTone?: "brand" | "neutral";
}) {
  const headerBackground =
    args.headerTone === "neutral"
      ? "#F8FBF8"
      : `linear-gradient(135deg, ${EMAIL_BRAND_GREEN} 0%, #2D8E3A 100%)`;
  const headerTextColor = args.headerTone === "neutral" ? EMAIL_TEXT : "#FFFFFF";
  const eyebrowColor = args.headerTone === "neutral" ? EMAIL_BRAND_GREEN : "#D9F7DE";

  return `
    <div style="margin:0;padding:24px 12px;background:#ffffff;color:${EMAIL_TEXT};font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:680px;margin:0 auto;border:1px solid ${EMAIL_BORDER};border-radius:20px;overflow:hidden;background:#ffffff;">
        <div style="padding:28px 24px;background:${headerBackground};color:${headerTextColor};">
          <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:${eyebrowColor};">
            ${args.eyebrow}
          </p>
          <h1 style="margin:0;font-size:28px;line-height:1.2;font-weight:700;color:${headerTextColor};">
            ${args.title}
          </h1>
        </div>
        <div style="padding:28px 24px;">
          ${args.introHtml}
          ${args.bodyHtml}
        </div>
        ${
          args.footerHtml
            ? `<div style="padding:18px 24px;border-top:1px solid ${EMAIL_BORDER};background:${EMAIL_PANEL};color:${EMAIL_MUTED};font-size:13px;line-height:1.6;">${args.footerHtml}</div>`
            : ""
        }
      </div>
    </div>
  `;
}

function buildInfoPanel(rows: Array<{ label: string; value: string }>) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;border:1px solid ${EMAIL_BORDER};border-radius:16px;background:${EMAIL_PANEL};">
      <tbody>
        ${rows
          .map(
            (row, index) => `
              <tr>
                <td style="padding:14px 16px;${
                  index < rows.length - 1 ? `border-bottom:1px solid ${EMAIL_BORDER};` : ""
                }font-size:14px;line-height:1.5;color:${EMAIL_MUTED};">
                  <strong style="display:block;margin-bottom:4px;color:${EMAIL_BRAND_GREEN};font-size:12px;letter-spacing:1px;text-transform:uppercase;">${escapeHtml(
                    row.label,
                  )}</strong>
                  <span style="color:${EMAIL_TEXT};font-size:15px;">${escapeHtml(
                    row.value,
                  )}</span>
                </td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function buildSectionHeading(title: string) {
  return `<h2 style="margin:28px 0 12px;font-size:18px;line-height:1.3;font-weight:700;color:${EMAIL_BRAND_GREEN};">${escapeHtml(
    title,
  )}</h2>`;
}

export function buildCustomerConfirmationEmail(
  data: SubmissionPdfData,
): TransactionalEmailContent {
  const selectedOptions = flattenOptionLines(data);
  const optionsMarkup =
    selectedOptions.length > 0
      ? `<ul>${selectedOptions
          .map((line) => `<li>${escapeHtml(line)}</li>`)
          .join("")}</ul>`
      : "<p>No additional options were selected.</p>";
  const optionsText =
    selectedOptions.length > 0
      ? selectedOptions.map((line) => `- ${line}`).join("\n")
      : "No additional options were selected.";

  const subject = `We have received your Go-Pods enquiry (${data.reference})`;

  return {
    subject,
    htmlContent: buildEmailShell({
      eyebrow: "Go-Pods Configurator",
      title: "Thank you for your enquiry",
      introHtml: `
        <p style="margin:0 0 12px;font-size:16px;line-height:1.7;color:${EMAIL_TEXT};">Hi ${escapeHtml(
          data.customer.name,
        )},</p>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:${EMAIL_TEXT};">
          We have received your Go-Pods configurator enquiry. A member of the sales team will review it and be in touch shortly.
        </p>
        ${buildInfoPanel([
          { label: "Reference", value: data.reference },
          { label: "Model", value: data.model.name },
          {
            label: "Enquiry type",
            value: enquiryTypeLabels[data.customer.enquiryType],
          },
        ])}
      `,
      bodyHtml: `
        ${buildSectionHeading("Selected options")}
        <div style="font-size:15px;line-height:1.7;color:${EMAIL_TEXT};">
          ${optionsMarkup}
        </div>
        ${buildSectionHeading("Pricing summary")}
        ${buildInfoPanel([
          { label: "Base price", value: formatPrice(data.pricing.basePrice) },
          { label: "Options total", value: formatPrice(data.pricing.optionsTotal) },
          { label: "Total price", value: formatPrice(data.pricing.totalPrice) },
        ])}
        <div style="margin-top:24px;padding:18px 20px;border-radius:16px;background:${EMAIL_PANEL};border:1px solid ${EMAIL_BORDER};">
          <p style="margin:0;font-size:15px;line-height:1.7;color:${EMAIL_TEXT};">
            Your enquiry has been received successfully. Quotations, payment, and any follow-up documents will be handled separately by the Go-Pods team.
          </p>
        </div>
      `,
      footerHtml:
        "Go-Pods will follow up with you directly. This email confirms receipt of your enquiry only.",
    }),
    textContent: `Hi ${data.customer.name},

We have received your Go-Pods configurator enquiry. A member of the sales team will review it and be in touch shortly.

Reference: ${data.reference}
Model: ${data.model.name}
Enquiry type: ${enquiryTypeLabels[data.customer.enquiryType]}

Selected options:
${optionsText}

Pricing summary:
Base price: ${formatPrice(data.pricing.basePrice)}
Options total: ${formatPrice(data.pricing.optionsTotal)}
Total price: ${formatPrice(data.pricing.totalPrice)}

This email confirms receipt of your enquiry only. Quotations, payment, and further documents will be handled separately.`,
  };
}

export function buildInternalNotificationEmail(
  data: SubmissionPdfData,
): TransactionalEmailContent {
  const groupedOptions = data.optionsByCategory
    .map((group) => {
      const lines =
        group.items.length > 0
          ? group.items
              .map(
                (item) =>
                  `<li>${escapeHtml(item.title)} • ${escapeHtml(
                    formatPrice(item.price),
                  )} • ${escapeHtml(formatWeightKg(item.weight))}</li>`,
              )
              .join("")
          : "<li>No options selected</li>";

      return `<h3 style="margin:18px 0 8px;font-size:15px;">${escapeHtml(
        group.categoryName,
      )}</h3><ul style="margin:0 0 10px 18px;padding:0;">${lines}</ul>`;
    })
    .join("");

  const textOptions =
    data.optionsByCategory.length > 0
      ? data.optionsByCategory
          .map((group) => {
            const items =
              group.items.length > 0
                ? group.items
                    .map(
                      (item) =>
                        `  - ${item.title} | ${formatPrice(item.price)} | ${formatWeightKg(item.weight)}`,
                    )
                    .join("\n")
                : "  - No options selected";
            return `${group.categoryName}\n${items}`;
          })
          .join("\n\n")
      : "No options selected";

  const subject = `New Go-Pods enquiry: ${data.reference}`;

  return {
    subject,
    htmlContent: buildEmailShell({
      eyebrow: "Go-Pods Sales Notification",
      title: "New configurator submission",
      headerTone: "neutral",
      introHtml: buildInfoPanel([
        { label: "Reference", value: data.reference },
        { label: "Submitted", value: formatSubmissionDate(data.submittedAt) },
        {
          label: "Enquiry type",
          value: enquiryTypeLabels[data.customer.enquiryType],
        },
      ]),
      bodyHtml: `
        ${buildSectionHeading("Customer")}
        ${buildInfoPanel([
          { label: "Name", value: data.customer.name },
          { label: "Email", value: data.customer.email },
          { label: "Phone", value: data.customer.phone },
          { label: "Postcode", value: data.customer.postcode ?? "Not provided" },
        ])}

        ${buildSectionHeading("Configuration")}
        ${buildInfoPanel([
          { label: "Model", value: data.model.name },
          { label: "Base price", value: formatPrice(data.pricing.basePrice) },
          { label: "Options total", value: formatPrice(data.pricing.optionsTotal) },
          { label: "Total price", value: formatPrice(data.pricing.totalPrice) },
          { label: "Base MiRO", value: formatWeightKg(data.weights.baseMiro) },
          {
            label: "Added option weight",
            value: formatWeightKg(data.weights.addedOptionWeight),
          },
          { label: "Updated MiRO", value: formatWeightKg(data.weights.updatedMiro) },
        ])}

        ${buildSectionHeading("Selected options")}
        <div style="font-size:15px;line-height:1.7;color:${EMAIL_TEXT};">
          ${groupedOptions || "<p>No options selected.</p>"}
        </div>

        ${buildSectionHeading("Notes")}
        <div style="padding:18px 20px;border-radius:16px;background:${EMAIL_PANEL};border:1px solid ${EMAIL_BORDER};font-size:15px;line-height:1.7;color:${EMAIL_TEXT};">
          ${escapeHtml(data.customer.notes ?? "No notes provided.")}
        </div>
      `,
      footerHtml:
        "Operational notification for the Go-Pods sales team. No attachment or PDF link is included in this pass.",
    }),
    textContent: `New Go-Pods configurator submission

Reference: ${data.reference}
Submitted: ${formatSubmissionDate(data.submittedAt)}
Enquiry type: ${enquiryTypeLabels[data.customer.enquiryType]}

Customer
Name: ${data.customer.name}
Email: ${data.customer.email}
Phone: ${data.customer.phone}
Postcode: ${data.customer.postcode ?? "Not provided"}

Configuration
Model: ${data.model.name}
Base price: ${formatPrice(data.pricing.basePrice)}
Options total: ${formatPrice(data.pricing.optionsTotal)}
Total price: ${formatPrice(data.pricing.totalPrice)}
Base MiRO: ${formatWeightKg(data.weights.baseMiro)}
Added option weight: ${formatWeightKg(data.weights.addedOptionWeight)}
Updated MiRO: ${formatWeightKg(data.weights.updatedMiro)}

Selected options
${textOptions}

Notes
${data.customer.notes ?? "No notes provided."}`,
  };
}

function flattenOptionLines(data: SubmissionPdfData) {
  return data.optionsByCategory.flatMap((group) =>
    group.items.map(
      (item) =>
        `${group.categoryName}: ${item.title} (${formatPrice(item.price)}, ${formatWeightKg(item.weight)})`,
    ),
  );
}

function formatSubmissionDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
