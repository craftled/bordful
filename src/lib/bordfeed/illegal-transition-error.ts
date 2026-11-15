export class IllegalTransitionError extends Error {
  readonly reason: string;

  constructor(reason: string) {
    super(reason);
    this.name = "IllegalTransitionError";
    this.reason = reason;
  }
}
