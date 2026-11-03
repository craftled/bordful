import Link from "next/link";

import { loadBoardPool } from "@/lib/board/pool";
import { countTaxonomy, type TaxonomyFacet } from "@/lib/board/taxonomy";
import { getSiteSettings } from "@/lib/read";

// The footer links to these ids (/jobs#job-types and friends), keep them in sync.
function Group({
  facets,
  id,
  title,
}: {
  facets: TaxonomyFacet[];
  id: string;
  title: string;
}) {
  const shown = facets.filter((facet) => facet.count > 0);
  if (shown.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={`${id}-heading`} className="space-y-4" id={id}>
      <h2 className="text-xl font-semibold" id={`${id}-heading`}>
        {title}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((facet) => (
          <li key={facet.slug}>
            <Link
              className="bg-background hover:bg-muted focus-visible:outline-ring block rounded-lg border p-4 focus-visible:outline-2 focus-visible:outline-offset-2"
              data-testid="taxonomy-link"
              href={facet.href}
            >
              <span className="block font-medium">{facet.label}</span>
              <span className="text-muted-foreground block text-sm">
                {facet.count} {facet.count === 1 ? "position" : "positions"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export async function TaxonomyHub() {
  const [settings, cards] = await Promise.all([
    getSiteSettings(),
    loadBoardPool(),
  ]);
  const counts = countTaxonomy(cards);

  return (
    <div className="space-y-10" data-testid="taxonomy-hub">
      <div className="space-y-2">
        <h1 className="font-[var(--font-heading)] text-3xl font-semibold">
          {settings.board.title || "Browse jobs"}
        </h1>
        {settings.board.description ? (
          <p className="text-muted-foreground">{settings.board.description}</p>
        ) : null}
        <p className="text-muted-foreground text-sm">
          Open roles grouped by type, level, location, and language.
        </p>
      </div>
      <Group facets={counts.types} id="job-types" title="Job types" />
      <Group facets={counts.levels} id="levels" title="Levels" />
      <Group facets={counts.locations} id="locations" title="Locations" />
      <Group facets={counts.languages} id="languages" title="Languages" />
    </div>
  );
}
