import { ogCard } from "@/src/lib/og";

export const dynamic = "force-static";

export function GET() {
  return ogCard({
    kicker: "Ali Abdullah · Product engineer",
    title: "Web and mobile products, and which part was mine",
    footer: "Next.js · React Native · Django",
  });
}
