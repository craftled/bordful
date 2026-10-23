import type { Payload } from "payload";

import type { Job } from "@/payload-types";

import { acmeCompany, exampleCompany, exampleDescription } from "./board";

export async function loadBoardFixture(payload: Payload): Promise<void> {
  const example = await payload.create({
    collection: "companies",
    data: exampleCompany,
    depth: 0,
    overrideAccess: true,
  });
  const acme = await payload.create({
    collection: "companies",
    data: acmeCompany,
    depth: 0,
    overrideAccess: true,
  });

  await payload.create({
    collection: "jobs",
    data: {
      _status: "published",
      careerLevel: ["Senior"],
      company: example.id,
      companyName: "Example Co",
      countryCode: "US",
      description: exampleDescription as NonNullable<Job["description"]>,
      employmentType: "full-time",
      languages: [{ value: "en" }],
      origin: "manual",
      publishedAt: "2026-10-20T09:00:00.000Z",
      salaryCurrency: "USD",
      salaryMax: 160_000,
      salaryMin: 120_000,
      seniority: "senior",
      slug: "example-senior-backend-engineer",
      title: "Example Senior Backend Engineer",
      workplaceType: "remote",
    },
    depth: 0,
    overrideAccess: true,
  });

  await payload.create({
    collection: "jobs",
    data: {
      _status: "published",
      company: acme.id,
      companyName: "Acme Example Ltd",
      countryCode: "DE",
      description: exampleDescription as NonNullable<Job["description"]>,
      employmentType: "contract",
      origin: "paid",
      paymentReference: "test_ref_0001",
      publishedAt: "2026-10-21T09:00:00.000Z",
      slug: "example-product-designer",
      title: "Example Product Designer",
      validThrough: "2099-01-01T00:00:00.000Z",
      workplaceType: "hybrid",
    },
    depth: 0,
    overrideAccess: true,
  });

  await payload.create({
    collection: "jobs",
    data: {
      _status: "published",
      bordfeedJobId: "00000000-0000-4000-8000-000000000001",
      companyName: "Example Co",
      description: exampleDescription as NonNullable<Job["description"]>,
      origin: "bordfeed_sample",
      publishedAt: "2026-10-22T09:00:00.000Z",
      slug: "sample-remote-data-analyst",
      title: "Sample Remote Data Analyst",
      workplaceType: "remote",
    },
    depth: 0,
    overrideAccess: true,
  });
}
