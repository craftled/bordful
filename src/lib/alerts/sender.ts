import { Resend } from "resend";

export interface OutgoingEmail {
  from: string;
  headers: Record<string, string>;
  html: string;
  subject: string;
  text: string;
  to: string;
}

export interface AlertSender {
  send: (message: OutgoingEmail, idempotencyKey: string) => Promise<void>;
}

export function resendSender(apiKey: string): AlertSender {
  const resend = new Resend(apiKey);

  return {
    async send(message, idempotencyKey) {
      const result = await resend.emails.send(
        {
          from: message.from,
          headers: message.headers,
          html: message.html,
          subject: message.subject,
          text: message.text,
          to: message.to,
        },
        { idempotencyKey }
      );

      if (result.error) {
        throw new Error(`Resend rejected the message (${result.error.name})`);
      }
    },
  };
}
