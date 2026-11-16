import { getPost, getPosts, toMarkdown } from "@/src/lib/content";
import { absolute } from "@/src/lib/site";

export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = () => getPosts().filter((post) => !post.draft).map((post) => ({ slug: post.slug }));

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug)!;
  return new Response(toMarkdown(post, absolute(`/blog/${post.slug}/`), true), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
