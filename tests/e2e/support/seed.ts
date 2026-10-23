import type { APIRequestContext } from "@playwright/test";

export interface LexicalText {
  detail: number;
  format: number;
  mode: "normal";
  style: string;
  text: string;
  type: "text";
  version: number;
}

export function lexicalParagraph(text: string): {
  root: {
    children: {
      children: LexicalText[];
      direction: "ltr";
      format: string;
      indent: number;
      type: "paragraph";
      version: number;
    }[];
    direction: "ltr";
    format: string;
    indent: number;
    type: "root";
    version: number;
  };
} {
  return {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text,
              type: "text",
              version: 1,
            },
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
        },
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
}

async function readBody(
  response: Awaited<ReturnType<APIRequestContext["post"]>>
): Promise<Record<string, unknown>> {
  const body = (await response.json()) as Record<string, unknown>;
  if (!response.ok()) {
    throw new Error(`REST ${response.status()} ${JSON.stringify(body)}`);
  }

  const { doc } = body;
  if (doc !== null && typeof doc === "object") {
    return doc as Record<string, unknown>;
  }

  return body;
}

export async function createCompany(
  request: APIRequestContext,
  input: { domain?: string; name: string; website?: string }
): Promise<Record<string, unknown>> {
  const response = await request.post("/api/companies", {
    data: {
      name: input.name,
      origin: "manual",
      ...(input.domain === undefined ? {} : { domain: input.domain }),
      ...(input.website === undefined ? {} : { website: input.website }),
    },
  });
  return readBody(response);
}

export async function createJob(
  request: APIRequestContext,
  data: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const response = await request.post("/api/jobs", { data });
  return readBody(response);
}

export async function updateGlobal(
  request: APIRequestContext,
  slug: string,
  data: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const response = await request.post(`/api/globals/${slug}`, { data });
  return readBody(response);
}

export async function readGlobal(
  request: APIRequestContext,
  slug: string
): Promise<Record<string, unknown>> {
  const response = await request.get(`/api/globals/${slug}`);
  return readBody(response);
}

export function docString(doc: Record<string, unknown>, key: string): string {
  const value = doc[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`missing ${key}`);
  }
  return value;
}
