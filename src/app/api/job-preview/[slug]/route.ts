import { isPublicJobSlug } from "@/lib/board/paths";
import { getJobBySlug } from "@/lib/read";
import { plainJobDescription } from "@/lib/seo/plaintext";

// The list preview's "About the role" text. It reads the job the same way
// the full job page does, so every job a visitor can open, Bordfeed samples
// included, has a preview.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  const { slug } = await params;
  const job = isPublicJobSlug(slug) ? await getJobBySlug(slug) : null;
  if (!job) {
    return Response.json({ error: "not found" }, { status: 404 });
  }

  return Response.json({ text: plainJobDescription(job.description) });
}
