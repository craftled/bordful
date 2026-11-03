export interface StoredEmail {
  from: string;
  headers: Record<string, string>;
  html: string;
  idempotencyKey: string | null;
  subject: string;
  text: string;
  to: string | string[];
}

export interface ResendMockState {
  emails: StoredEmail[];
}

export interface ResendMock {
  handle: (request: Request) => Promise<Response>;
  reset: () => void;
  state: ResendMockState;
}

function emailId(index: number): string {
  return `email_mock_${String(index).padStart(4, "0")}`;
}

function headerRecord(value: unknown): Record<string, string> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const headers: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") {
      headers[key] = entry;
    }
  }

  return headers;
}

function validationError(): Response {
  return Response.json(
    {
      error: {
        code: "validation_error",
        message: "from, to and subject are required",
      },
    },
    { status: 422 }
  );
}

function textField(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function recipient(value: unknown): string | string[] | null {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  if (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((entry) => typeof entry === "string")
  ) {
    return value;
  }
  return null;
}

function parseOutgoing(payload: unknown): {
  from: string;
  headers: Record<string, string>;
  html: string;
  subject: string;
  text: string;
  to: string | string[];
} | null {
  if (payload === null || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const { from, subject } = record;
  const to = recipient(record.to);
  if (typeof from !== "string" || from.length === 0) {
    return null;
  }
  if (typeof subject !== "string" || subject.length === 0 || to === null) {
    return null;
  }

  return {
    from,
    headers: headerRecord(record.headers),
    html: textField(record.html),
    subject,
    text: textField(record.text),
    to,
  };
}

export function createResendMock(): ResendMock {
  const state: ResendMockState = { emails: [] };
  const idsByKey = new Map<string, string>();
  let sequence = 0;

  return {
    async handle(request) {
      if (request.method !== "POST") {
        return new Response("not found", { status: 404 });
      }

      const url = new URL(request.url);
      if (url.pathname !== "/emails") {
        return new Response("not found", { status: 404 });
      }

      const idempotencyKey = request.headers.get("idempotency-key");
      if (idempotencyKey !== null) {
        const existing = idsByKey.get(idempotencyKey);
        if (existing !== undefined) {
          return Response.json({ id: existing });
        }
      }

      let payload: unknown;
      try {
        payload = await request.json();
      } catch {
        return validationError();
      }

      const outgoing = parseOutgoing(payload);
      if (outgoing === null) {
        return validationError();
      }

      sequence += 1;
      const id = emailId(sequence);
      state.emails.push({ ...outgoing, idempotencyKey });
      if (idempotencyKey !== null) {
        idsByKey.set(idempotencyKey, id);
      }

      return Response.json({ id });
    },
    reset() {
      state.emails = [];
      idsByKey.clear();
      sequence = 0;
    },
    state,
  };
}
