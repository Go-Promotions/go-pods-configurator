import {
  buildCustomerConfirmationEmail,
  buildInternalNotificationEmail,
} from "@/features/enquiry/lib/email-templates";
import {
  getTransactionalEmailConfig,
  hasTransactionalEmailConfig,
} from "@/features/enquiry/lib/email-config";
import { getSubmissionPdfData } from "@/features/enquiry/lib/get-submission-pdf-data";
import { sendTransactionalEmail } from "@/features/enquiry/lib/brevo";
import type { ConfiguratorSubmissionSuccess } from "@/types/configurator";

export async function sendSubmissionEmails(args: {
  configurationId: string;
  reference: string;
}) {
  if (!hasTransactionalEmailConfig()) {
    return {
      status: "failed",
      message:
        "Your enquiry was saved, but confirmation emails are not configured yet.",
    } satisfies ConfiguratorSubmissionSuccess["emailDelivery"];
  }

  const data = await getSubmissionPdfData(args.configurationId, args.reference);

  if (!data) {
    return {
      status: "failed",
      message:
        "Your enquiry was saved, but we could not prepare the email summary.",
    } satisfies ConfiguratorSubmissionSuccess["emailDelivery"];
  }

  const config = getTransactionalEmailConfig();
  const customerEmail = buildCustomerConfirmationEmail(data);
  const internalEmail = buildInternalNotificationEmail(data);

  const results = await Promise.allSettled([
    sendTransactionalEmail({
      to: [{ email: data.customer.email, name: data.customer.name }],
      subject: customerEmail.subject,
      htmlContent: customerEmail.htmlContent,
      textContent: customerEmail.textContent,
      tags: ["go-pods-configurator", "customer-confirmation"],
    }),
    sendTransactionalEmail({
      to: [{ email: config.adminNotificationEmail, name: "Go-Pods Sales" }],
      subject: internalEmail.subject,
      htmlContent: internalEmail.htmlContent,
      textContent: internalEmail.textContent,
      tags: ["go-pods-configurator", "internal-notification"],
    }),
  ]);

  const customerFailed = results[0].status === "rejected";
  const internalFailed = results[1].status === "rejected";

  if (!customerFailed && !internalFailed) {
    return {
      status: "sent",
    } satisfies ConfiguratorSubmissionSuccess["emailDelivery"];
  }

  if (customerFailed && internalFailed) {
    return {
      status: "failed",
      message:
        "Your enquiry was saved, but we could not send the confirmation emails right now.",
    } satisfies ConfiguratorSubmissionSuccess["emailDelivery"];
  }

  return {
    status: "partial_failure",
    message:
      "Your enquiry was saved, but one of the confirmation emails could not be sent right now.",
  } satisfies ConfiguratorSubmissionSuccess["emailDelivery"];
}
