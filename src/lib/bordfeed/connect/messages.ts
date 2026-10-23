export function registeredMessage(email: string): string {
  return `We sent a 6-digit code to ${email}. Enter it below.`;
}

export const WRONG_CODE_MESSAGE =
  "That code did not match. Check the email and try again.";

export const REGISTER_RATE_LIMIT_MESSAGE =
  "Bordfeed allows 5 signups per hour from this server's address. Paste an API key from your Bordfeed dashboard instead, or try again in an hour.";

export const ALREADY_ISSUED_MESSAGE =
  "This code was already used and its API key was issued. Paste your Bordfeed API key instead.";

export const WORKSPACE_REQUIRED_MESSAGE =
  "Choose which Bordfeed workspace to connect.";

export function connectedMessage(count: number): string {
  return `Connected. Synced ${count} jobs from Bordfeed.`;
}

export function connectedSyncFailedMessage(safe: string): string {
  return `Connected. The first sync failed: ${safe}`;
}

export const REGISTRATION_EXPIRED_MESSAGE = "The code expired. Start again.";

export const RESET_MESSAGE = "Disconnected. The board shows sample jobs again.";

export const ALREADY_CONNECTED_MESSAGE =
  "Already connected. Disconnect first to connect another account.";

export const ADMIN_ONLY_MESSAGE = "Only admins can connect Bordfeed.";

export const CONNECT_LIMIT_MESSAGE =
  "Too many signup attempts. Try again in a few minutes.";

export const VERIFY_LIMIT_MESSAGE =
  "Too many code attempts for this signup. Start again or paste an API key.";

export const INVALID_KEY_MESSAGE =
  "Enter a Bordfeed API key between 10 and 200 characters.";

export const INVALID_START_MESSAGE =
  "Enter a valid email and a board name up to 100 characters.";

export const NEED_CODE_MESSAGE = "Enter your email to get a code first.";

export const CREDIT_HIDDEN_MESSAGE = "The Jobs by Bordfeed credit is hidden.";

export const CREDIT_SHOWN_MESSAGE = "The Jobs by Bordfeed credit is shown.";

export function syncedMessage(count: number): string {
  return `Synced ${count} jobs from Bordfeed.`;
}
