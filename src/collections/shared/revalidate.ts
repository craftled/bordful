import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
} from "payload";

import { revalidateReadTags } from "@/lib/read/revalidate";
import { companyTag, jobTag } from "@/lib/read/tags";

export function slugOf(doc: unknown): string {
  if (doc !== null && typeof doc === "object" && "slug" in doc) {
    return typeof doc.slug === "string" ? doc.slug : "";
  }

  return "";
}

function tagsForSlugChange(
  base: readonly string[],
  doc: unknown,
  previousDoc: unknown,
  tagFor: (slug: string) => string
): string[] {
  const next = slugOf(doc);
  const previous = slugOf(previousDoc);
  const tags = [...base, tagFor(next)];

  if (previous.length > 0 && previous !== next) {
    tags.push(tagFor(previous));
  }

  return tags;
}

export const revalidateJobs: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
}) => {
  revalidateReadTags(tagsForSlugChange(["jobs"], doc, previousDoc, jobTag));
  return doc;
};

export const revalidateJobsDelete: CollectionAfterDeleteHook = ({ doc }) => {
  revalidateReadTags(["jobs", jobTag(slugOf(doc))]);
  return doc;
};

export const revalidateCompanies: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
}) => {
  revalidateReadTags(
    tagsForSlugChange(["companies", "jobs"], doc, previousDoc, companyTag)
  );
  return doc;
};

export const revalidateCompaniesDelete: CollectionAfterDeleteHook = ({
  doc,
}) => {
  revalidateReadTags(["companies", companyTag(slugOf(doc)), "jobs"]);
  return doc;
};
