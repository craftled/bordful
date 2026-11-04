import type { Payload, PayloadRequest } from "payload";

import type { Job } from "@/payload-types";

import {
  type BlockableJob,
  type Blocklist,
  EMPTY_BLOCKLIST,
  isBlocked,
  isEmptyBlocklist,
  parseBlocklist,
} from "./blocklist";
import { eachDoc, eachSerial } from "./each";
import type { MappedJob } from "./map-job";

export async function readBlocklist(payload: Payload): Promise<Blocklist> {
  try {
    const doc = await payload.findGlobal({
      depth: 0,
      overrideAccess: true,
      slug: "import-blocklist",
    });
    return parseBlocklist(doc);
  } catch (error) {
    // Before the migration runs the table is missing. Import as before.
    payload.logger.warn(
      { err: error },
      "Could not read the import blocklist. Importing without it."
    );
    return EMPTY_BLOCKLIST;
  }
}

export function blockableFromMapped(job: MappedJob): BlockableJob {
  return {
    applyUrl: job.applyUrl,
    companyDomain: job.company?.domain ?? null,
    companyName: job.company?.name ?? null,
    sourceListingUrl: job.sourceListingUrl,
    summary: job.summary,
    title: job.title,
  };
}

export function blockableFromJob(job: Job): BlockableJob {
  return {
    applyUrl: job.applyUrl ?? null,
    companyDomain: job.companyDomain ?? null,
    companyName: job.companyName,
    sourceListingUrl: job.sourceListingUrl ?? null,
    summary: job.summary ?? null,
    title: job.title,
  };
}

// Saving the blocklist takes matching imported jobs off the board right away.
// Syncs only see new or changed jobs, so without this an imported job would
// stay up until Bordfeed sent it again. Manual and paid jobs are never touched.
export async function unpublishBlockedJobs(
  payload: Payload,
  list: Blocklist,
  req?: PayloadRequest
): Promise<number> {
  if (isEmptyBlocklist(list)) {
    return 0;
  }

  const jobs = await eachDoc((page) =>
    payload.find({
      collection: "jobs",
      depth: 0,
      limit: 100,
      overrideAccess: true,
      page,
      req,
      where: {
        and: [
          { _status: { equals: "published" } },
          { origin: { in: ["bordfeed", "bordfeed_sample"] } },
        ],
      },
    })
  );
  const blocked = jobs.filter((job) => isBlocked(blockableFromJob(job), list));
  await eachSerial(blocked, async (job) => {
    await payload.update({
      collection: "jobs",
      data: { _status: "draft" },
      depth: 0,
      id: job.id,
      overrideAccess: true,
      req,
    });
  });

  return blocked.length;
}
