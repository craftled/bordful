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
  // The SDK throws on an empty key at construction time. Alerts stay off
  // until a key exists, so the client is built on the first real send.
  let resend: Resend | null = null;

  return {
    async send(message, idempotencyKey) {
      resend ??= new Resend(apiKey);
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
