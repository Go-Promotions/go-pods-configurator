import { getTransactionalEmailConfig } from "@/features/enquiry/lib/email-config";

interface BrevoRecipient {
  email: string;
  name?: string;
}

interface SendTransactionalEmailArgs {
  to: BrevoRecipient[];
  subject: string;
  htmlContent: string;
  textContent: string;
  tags?: string[];
}

export async function sendTransactionalEmail({
  to,
  subject,
  htmlContent,
  textContent,
  tags,
}: SendTransactionalEmailArgs) {
  const config = getTransactionalEmailConfig();

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": config.apiKey,
    },
    body: JSON.stringify({
      sender: config.sender,
      replyTo: config.replyToEmail ? { email: config.replyToEmail } : undefined,
      to,
      subject,
      htmlContent,
      textContent,
      tags,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Brevo transactional email request failed with ${response.status}: ${errorBody}`,
    );
  }

  return response.json() as Promise<{ messageId: string }>;
}
