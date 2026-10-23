import type { Payload } from "payload";

import type { Job } from "@/payload-types";

import {
  acmeCompany,
  exampleCompany,
  exampleDescription,
  exampleProductDesignerJob,
  exampleSeniorBackendJob,
  sampleRemoteDataAnalystJob,
} from "./board";

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
      ...exampleSeniorBackendJob,
      company: example.id,
      description: exampleDescription as NonNullable<Job["description"]>,
    },
    depth: 0,
    overrideAccess: true,
  });

  await payload.create({
    collection: "jobs",
    data: {
      ...exampleProductDesignerJob,
      company: acme.id,
      description: exampleDescription as NonNullable<Job["description"]>,
    },
    depth: 0,
    overrideAccess: true,
  });

  await payload.create({
    collection: "jobs",
    data: {
      ...sampleRemoteDataAnalystJob,
      description: exampleDescription as NonNullable<Job["description"]>,
    },
    depth: 0,
    overrideAccess: true,
  });
}
