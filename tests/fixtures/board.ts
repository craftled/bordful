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
