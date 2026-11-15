export function registeredMessage(email: string): string {
  return `We sent a 6-digit code to ${email}. Enter it below.`;
}

export const WRONG_CODE_MESSAGE =
  "That code did not match. Check the email and try again.";

export const REGISTER_RATE_LIMIT_MESSAGE =
  "Bordfeed allows 5 signups per hour from this server's address. Paste an API key from your Bordfeed dashboard instead, or try again in an hour.";

export const ALREADY_ISSUED_MESSAGE =
  "This code was already used and its API key was issued. Paste your Bordfeed API key instead.";

// Bordfeed refuses to issue a key from an emailed code when the account has
// two-factor sign-in. The key has to come from a signed-in dashboard session.
export function twoFactorMessage(bordfeedOrigin: string): string {
  return `This Bordfeed account uses two-factor sign-in, so an emailed code cannot create an API key. Sign in at ${bordfeedOrigin}/dashboard/organization/api-keys, create a key, and paste it below.`;
}

export const ACCOUNT_DISABLED_MESSAGE =
  "This Bordfeed account is disabled. Connect with a different email, or paste an API key from another Bordfeed account.";

export const SIGNUP_DISABLED_MESSAGE =
  "Bordfeed is not accepting new sign-ups right now. Paste an API key from an existing Bordfeed account instead.";

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

function importedJobs(count: number): string {
  return count === 1 ? "1 imported job" : `${count} imported jobs`;
}

export function resetMessage(deleted: number): string {
  return deleted === 0
    ? RESET_MESSAGE
    : `Disconnected. Deleted ${importedJobs(deleted)}. The board shows sample jobs again.`;
}

export const DISCONNECT_BUSY_MESSAGE =
  "A Bordfeed sync is running. Try Disconnect again in a minute.";

// The confirm step before a disconnect. Disconnect deletes imported jobs, and
// a reconnect starts again from the newest page of the feed.
export function disconnectWarning(
  imported: number,
  jobsPerSync: number
): string {
  if (imported === 0) {
    return "Disconnecting removes the saved key and shows sample jobs again.";
  }
  return `Disconnecting deletes the ${importedJobs(imported)} and the saved key, and shows sample jobs again. Reconnecting imports the newest ${jobsPerSync}.`;
}

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

export const ATTRIBUTION_CONNECTED_ONLY_MESSAGE =
  "The Jobs by Bordfeed credit can be hidden only while Bordfeed is connected.";

export function syncedMessage(count: number): string {
  return `Synced ${count} jobs from Bordfeed.`;
}

export const DAILY_CAP_MESSAGE =
  "Today's Bordfeed job limit is used up, so nothing was fetched. Syncs resume after midnight UTC. Change the limit in the Bordfeed Connection settings.";

export const SYNC_BUSY_MESSAGE =
  "Another Bordfeed sync is running, so nothing was fetched. Try again in a few minutes.";

// Sync now and connect report a skipped sync instead of "Synced 0 jobs".
export function skippedSyncMessage(fetch: string): string | null {
  if (fetch === "capped") {
    return DAILY_CAP_MESSAGE;
  }
  if (fetch === "busy") {
    return SYNC_BUSY_MESSAGE;
  }
  return null;
}
