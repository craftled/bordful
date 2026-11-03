export interface GithubRelease {
  draft: boolean;
  html_url: string;
  prerelease: boolean;
  tag_name: string;
}

export const DEFAULT_RELEASES: GithubRelease[] = [
  {
    draft: false,
    html_url: "https://github.com/craftled/bordful/releases/tag/v1.0.0-beta.2",
    prerelease: true,
    tag_name: "v1.0.0-beta.2",
  },
  {
    draft: false,
    html_url: "https://github.com/craftled/bordful/releases/tag/v1.0.0-beta.1",
    prerelease: true,
    tag_name: "v1.0.0-beta.1",
  },
];

export interface GithubMockState {
  releases: GithubRelease[];
}

export interface GithubMock {
  handle: (request: Request) => Promise<Response>;
  reset: () => void;
  state: GithubMockState;
}

function copyReleases(releases: GithubRelease[]): GithubRelease[] {
  return releases.map((release) => ({ ...release }));
}

export function createGithubMock(): GithubMock {
  const state: GithubMockState = {
    releases: copyReleases(DEFAULT_RELEASES),
  };

  return {
    handle(request) {
      const url = new URL(request.url);
      if (
        request.method === "GET" &&
        url.pathname === "/repos/craftled/bordful/releases"
      ) {
        return Promise.resolve(Response.json(state.releases));
      }

      return Promise.resolve(new Response("not found", { status: 404 }));
    },
    reset() {
      state.releases = copyReleases(DEFAULT_RELEASES);
    },
    state,
  };
}
