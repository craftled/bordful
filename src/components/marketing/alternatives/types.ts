export type IsoDate = `${number}-${number}-${number}`;

export interface Source<Id extends string = string> {
  checkedOn: IsoDate;
  fact: string;
  id: Id;
  title: string;
  url: string;
}

export interface Claim<Id extends string = string> {
  sources: readonly [Id, ...Id[]];
  text: string;
}

export interface ComparisonRow<Id extends string = string> {
  bordful: Claim<Id>;
  competitor: Claim<Id>;
  label: string;
}

export interface FaqItem {
  answer: string;
  question: string;
}

export interface Alternative<Id extends string = string> {
  comparison: readonly ComparisonRow<Id>[];
  faq: readonly FaqItem[];
  heading: { title: string; titleMuted: string };
  hub: { summary: Claim<Id>; linkLabel: string };
  lede: Claim<Id>;
  limits: readonly Claim<Id>[];
  metaDescription: string;
  metaTitle: string;
  migration: {
    intro: string;
    moves: readonly Claim<Id>[];
    staysBehind: readonly Claim<Id>[];
    steps: readonly (string | Claim<Id>)[];
  };
  name: string;
  pricing: readonly ComparisonRow<Id>[];
  slug: string;
  sources: readonly Source<Id>[];
  stay: readonly Claim<Id>[];
  switch: readonly Claim<Id>[];
}

type SourcedClaim<Id extends string> = Omit<Claim<Id>, "sources"> & {
  sources: readonly [NoInfer<Id>, ...NoInfer<Id>[]];
};

type AlternativeInput<Id extends string> = Omit<
  Alternative<Id>,
  | "lede"
  | "hub"
  | "stay"
  | "switch"
  | "limits"
  | "comparison"
  | "pricing"
  | "migration"
  | "sources"
> & {
  lede: SourcedClaim<Id>;
  hub: { summary: SourcedClaim<Id>; linkLabel: string };
  stay: readonly SourcedClaim<Id>[];
  switch: readonly SourcedClaim<Id>[];
  limits: readonly SourcedClaim<Id>[];
  comparison: readonly {
    label: string;
    competitor: SourcedClaim<Id>;
    bordful: SourcedClaim<Id>;
  }[];
  pricing: readonly {
    label: string;
    competitor: SourcedClaim<Id>;
    bordful: SourcedClaim<Id>;
  }[];
  migration: {
    intro: string;
    moves: readonly SourcedClaim<Id>[];
    staysBehind: readonly SourcedClaim<Id>[];
    steps: readonly (string | SourcedClaim<Id>)[];
  };
  sources: readonly Source<Id>[];
};

export function defineAlternative<const Id extends string>(
  page: AlternativeInput<Id>
): Alternative<Id> {
  return page;
}
