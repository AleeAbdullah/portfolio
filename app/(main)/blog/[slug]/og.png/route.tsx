import { getPost, getPosts } from "@/src/lib/content";
import { ogCard } from "@/src/lib/og";

export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = () => getPosts().map((post) => ({ slug: post.slug }));

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug);
  return ogCard({ kicker: "Ali Abdullah · Blog", title: post?.title ?? "Blog", footer: `${post?.minutes ?? ""} min read` });
}
