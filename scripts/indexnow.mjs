// Tells IndexNow engines (Bing, Yandex, Seznam, Naver) which pages the last commit changed, including deleted posts.
// Run after a production deploy: `node scripts/indexnow.mjs [base-ref]` (default HEAD^). Needs Node 22.18+ to import the .ts file.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { SITE_URL } from "../src/lib/site.ts";

const KEY = "b102cb2bf3b5047b13a05d27022c2887"; // must match public/<KEY>.txt
// Maps changed files to site paths: a post or note is its own page (also when deleted) plus the listings that show it.
// "*" means site code changed, which can touch any page, so every sitemap URL goes. Scripts, docs and CI change no page.
export function changedPaths(files, isDraft = () => false) {
  const paths = new Set();
  for (const file of files) {
    const entry = file.match(/^content\/(blog|field-notes)\/([^/]+)\.md$/);
    if (entry && isDraft(file)) continue; // drafts are noindex, so there is nothing to tell engines
    if (entry) ["/", `/${entry[1]}/`, `/${entry[1]}/${entry[2]}/`].forEach((p) => paths.add(p));
    else if (/^(app|src|public)\//.test(file) || file === ".pages.yml") paths.add("*");
  }
  return [...paths];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // shortcut: diffs the deploy commit against its first parent, which covers a merged PR; a direct multi-commit
  // push to master only reports its last commit. Pass the previous deploy's SHA as an argument if that starts to matter.
  const base = process.argv[2] ?? "HEAD^";
  const files = execFileSync("git", ["diff", "--name-only", base, "HEAD"], { encoding: "utf8" }).split("\n").filter(Boolean);
  const draft = (text) => /^draft:\s*true\s*$/m.test(text);
  const before = (file) => { try { return execFileSync("git", ["show", `${base}:${file}`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); } catch { return null; } };
  // Skip a draft only if it was a draft (or didn't exist) before too; unpublishing a page is a change engines should hear about.
  const paths = changedPaths(files, (file) => existsSync(file) && draft(readFileSync(file, "utf8")) && (before(file) === null || draft(before(file))));
  const all = paths.includes("*")
    ? [...(await fetch(new URL("/sitemap.xml", SITE_URL)).then((r) => r.text())).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
    : [];
  const urlList = [...new Set([...all, ...paths.filter((p) => p !== "*").map((p) => new URL(p, SITE_URL).toString())])];
  if (!urlList.length) {
    console.log("IndexNow: no page changes, nothing sent");
    process.exit(0);
  }
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: new URL(SITE_URL).host, key: KEY, keyLocation: new URL(`/${KEY}.txt`, SITE_URL).toString(), urlList }),
  });
  console.log(`IndexNow: ${res.status} for ${urlList.join(", ")}`);
  if (!res.ok) process.exit(1);
}
