import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BoardShell } from "@/components/board/board-shell";
import { PostJobPage } from "@/components/post/post-job-page";
import {
  buildPostJobView,
  postJobPageDescription,
} from "@/components/post/post-job-view";
import { getSiteSettings } from "@/lib/read";

async function loadView() {
  const settings = await getSiteSettings();
  return buildPostJobView(settings.postJob);
}

export async function generateMetadata(): Promise<Metadata> {
  const view = await loadView();
  if (view === null) {
    notFound();
  }

  return {
    description: postJobPageDescription(view),
    title: "Post a job",
  };
}

export default async function Page() {
  const view = await loadView();
  if (view === null) {
    notFound();
  }

  return (
    <BoardShell>
      <PostJobPage view={view} />
    </BoardShell>
  );
}
