import { Github, Linkedin, Mail } from "lucide-react";
import { email } from "@/src/lib/portfolioData";

// Where to reach Ali: shared by the sidebar and the desk's phone.
export const social = [
  { href: "https://github.com/AleeAbdullah", label: "GitHub", Icon: Github, external: true },
  { href: "https://www.linkedin.com/in/ali-abdullah-854716224", label: "LinkedIn", Icon: Linkedin, external: true },
  { href: `mailto:${email}`, label: "Email", Icon: Mail, external: false },
];
