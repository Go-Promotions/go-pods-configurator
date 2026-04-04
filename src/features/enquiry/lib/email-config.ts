const brevoApiKey = process.env.BREVO_API_KEY;
const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL;
const brevoSenderName = process.env.BREVO_SENDER_NAME;
const brevoAdminNotificationEmail = process.env.BREVO_ADMIN_NOTIFICATION_EMAIL;
const brevoReplyToEmail = process.env.BREVO_REPLY_TO_EMAIL;

export function hasTransactionalEmailConfig() {
  return Boolean(
    brevoApiKey &&
      brevoSenderEmail &&
      brevoSenderName &&
      brevoAdminNotificationEmail,
  );
}

export function getTransactionalEmailConfig() {
  if (!hasTransactionalEmailConfig()) {
    throw new Error(
      "Missing Brevo email configuration. Set BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME, and BREVO_ADMIN_NOTIFICATION_EMAIL.",
    );
  }

  return {
    apiKey: brevoApiKey as string,
    sender: {
      email: brevoSenderEmail as string,
      name: brevoSenderName as string,
    },
    adminNotificationEmail: brevoAdminNotificationEmail as string,
    replyToEmail: brevoReplyToEmail ?? null,
  };
}
