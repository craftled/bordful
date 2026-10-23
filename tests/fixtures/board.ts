export const exampleDescription = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Example description.",
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

export const exampleCompany = {
  domain: "example.com",
  name: "Example Co",
  origin: "manual" as const,
  slug: "example-co",
  website: "https://example.com",
};

export const acmeCompany = {
  domain: "acme.example",
  name: "Acme Example Ltd",
  origin: "manual" as const,
  slug: "acme-example-ltd",
  website: "https://acme.example",
};

export const exampleSeniorBackendJob = {
  _status: "published" as const,
  careerLevel: ["Senior"] as "Senior"[],
  companyName: "Example Co",
  countryCode: "US",
  description: exampleDescription,
  employmentType: "full-time" as const,
  languages: [{ value: "en" }],
  origin: "manual" as const,
  publishedAt: "2026-10-20T09:00:00.000Z",
  salaryCurrency: "USD",
  salaryMax: 160_000,
  salaryMin: 120_000,
  seniority: "senior" as const,
  slug: "example-senior-backend-engineer",
  title: "Example Senior Backend Engineer",
  workplaceType: "remote" as const,
};

export const exampleProductDesignerJob = {
  _status: "published" as const,
  companyName: "Acme Example Ltd",
  countryCode: "DE",
  description: exampleDescription,
  employmentType: "contract" as const,
  origin: "paid" as const,
  paymentReference: "test_ref_0001",
  publishedAt: "2026-10-21T09:00:00.000Z",
  slug: "example-product-designer",
  title: "Example Product Designer",
  validThrough: "2099-01-01T00:00:00.000Z",
  workplaceType: "hybrid" as const,
};

export const sampleRemoteDataAnalystJob = {
  _status: "published" as const,
  bordfeedJobId: "00000000-0000-4000-8000-000000000001",
  companyName: "Example Co",
  description: exampleDescription,
  origin: "bordfeed_sample" as const,
  publishedAt: "2026-10-22T09:00:00.000Z",
  slug: "sample-remote-data-analyst",
  title: "Sample Remote Data Analyst",
  workplaceType: "remote" as const,
};
