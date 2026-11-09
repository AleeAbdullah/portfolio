import type { ReactNode } from "react";
import Shell from "@/src/components/home/Shell";
import { getActivity } from "@/src/lib/github";

export default async function MainLayout({ children }: { children: ReactNode }) {
  return <Shell activity={await getActivity()}>{children}</Shell>;
}
