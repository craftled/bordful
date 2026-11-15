export const EMPTY_FEED_MESSAGE =
  "The Bordfeed feed came back empty, so the board kept its current jobs.";

export class SyncGuardError extends Error {
  constructor(message = EMPTY_FEED_MESSAGE) {
    super(message);
    this.name = "SyncGuardError";
  }
}
