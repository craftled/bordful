import { describe, expect, test } from "vitest";

import { rankSimilarJobs, type SimilarSource } from "./similar";

function job(
  overrides: Partial<SimilarSource> & { id: string }
): SimilarSource & { id: string } {
  return {
    categories: ["Engineering"],
    companyName: "Acme",
    employmentType: "full-time",
    locationDisplay: "Berlin, Germany",
    origin: "manual",
    publishedAt: "2026-10-01T00:00:00.000Z",
    title: `Role ${overrides.id}`,
    ...overrides,
  };
}

const current = job({ id: "current", title: "Backend Engineer" });

describe("rankSimilarJobs", () => {
  test("excludes the current job by id", () => {
    const result = rankSimilarJobs(current, [current, job({ id: "a" })], {
      includeSamples: false,
    });
    expect(result.map((item) => item.id)).toEqual(["a"]);
  });

  test("needs a shared category or employment type and the same location", () => {
    const result = rankSimilarJobs(
      current,
      [
        job({ categories: ["Design"], employmentType: "contract", id: "miss" }),
        job({ id: "other-city", locationDisplay: "Paris, France" }),
        job({ categories: ["Design"], id: "type-only" }),
      ],
      { includeSamples: false }
    );
    expect(result.map((item) => item.id)).toEqual(["type-only"]);
  });

  test("returns nothing when the current job has no location", () => {
    const result = rankSimilarJobs(
      { ...current, locationDisplay: null },
      [job({ id: "a" })],
      { includeSamples: false }
    );
    expect(result).toEqual([]);
  });

  test("dedupes by id and by title and company", () => {
    const result = rankSimilarJobs(
      current,
      [
        job({ id: "a", title: "Platform Engineer" }),
        job({ id: "a", title: "Platform Engineer 2" }),
        job({ companyName: "ACME", id: "b", title: "platform engineer" }),
        job({ companyName: "Acme", id: "c", title: "Backend Engineer" }),
      ],
      { includeSamples: false }
    );
    expect(result.map((item) => item.id)).toEqual(["a"]);
  });

  test("caps the list at five and prefers more shared signals", () => {
    const candidates = [
      job({ id: "t1", publishedAt: "2026-10-09T00:00:00.000Z" }),
      job({ id: "t2", publishedAt: "2026-10-08T00:00:00.000Z" }),
      job({ id: "t3", publishedAt: "2026-10-07T00:00:00.000Z" }),
      job({ id: "t4", publishedAt: "2026-10-06T00:00:00.000Z" }),
      job({ id: "t5", publishedAt: "2026-10-05T00:00:00.000Z" }),
      job({ id: "t6", publishedAt: "2026-10-04T00:00:00.000Z" }),
      job({
        categories: ["Engineering", "Data"],
        id: "best",
        publishedAt: "2026-09-01T00:00:00.000Z",
      }),
    ];
    const result = rankSimilarJobs(
      { ...current, categories: ["Engineering", "Data"] },
      candidates,
      { includeSamples: false }
    );
    expect(result).toHaveLength(5);
    expect(result[0]?.id).toBe("best");
  });

  test("keeps sample jobs out unless the board shows samples", () => {
    const sample = job({ id: "sample", origin: "bordfeed_sample" });
    expect(
      rankSimilarJobs(current, [sample], { includeSamples: false })
    ).toEqual([]);
    expect(
      rankSimilarJobs(current, [sample], { includeSamples: true }).map(
        (item) => item.id
      )
    ).toEqual(["sample"]);
  });
});
