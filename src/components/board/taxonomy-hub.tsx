import Link from "next/link";

import { isMarketingEnabled } from "@/config/flags";
import { loadBoardPool } from "@/lib/board/pool";
import { countTaxonomy, type TaxonomyFacet } from "@/lib/board/taxonomy";
import { getSiteSettings } from "@/lib/read";

function Group({ facets, title }: { facets: TaxonomyFacet[]; title: string }) {
  if (facets.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="font-semibold text-lg">{title}</h2>
      <ul className="flex flex-wrap gap-3">
        {facets.map((facet) => (
          <li key={facet.slug}>
            <Link data-testid="taxonomy-link" href={facet.href}>
              {facet.label} ({facet.count})
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
  const marketing = isMarketingEnabled();

  return (
    <div className="space-y-8" data-testid="taxonomy-hub">
      <div className="space-y-2">
        <h1 className="font-[var(--font-heading)] font-semibold text-3xl">
          {settings.board.title || "Browse jobs"}
        </h1>
        {settings.board.description ? (
          <p className="text-muted-foreground">{settings.board.description}</p>
        ) : null}
        {marketing ? null : (
          <p className="text-muted-foreground text-sm">
            Open roles grouped by type, level, location, and language.
          </p>
        )}
      </div>
      <Group facets={counts.types} title="Job types" />
      <Group facets={counts.levels} title="Levels" />
      <Group facets={counts.locations} title="Locations" />
      <Group facets={counts.languages} title="Languages" />
    </div>
  );
}
