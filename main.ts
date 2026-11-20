// gta6-meme-x-01 entrypoint (Node 22, standard library only).
//
// The entry is the X post itself: the house reads the post from X (its
// first picture, then its text) and hands that to the judge. This program
// only carries the post's address from the repository into the grader's
// output directory, where the gate reads it.
//
// POST.json at the repository root holds {"url": "https://x.com/<handle>/status/<id>"}.
// main.ts validates that shape (a JSON object with a url string pointing
// at an x.com / twitter.com status) and copies the file byte-for-byte to
// $MAKEFUN_OUTPUT_DIR/POST.json (defaults /bot and /output in the grader).
// It prints nothing on success, uses no network and no wall clock, so two
// runs write the same bytes.
//
// Run it locally the way the grader does:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? "/bot";
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const POST_FILE = "POST.json";

function fail(message: string): never {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

function isPostUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  let parsed: URL;
  try {
    // Tolerate stray whitespace around the URL (e.g. from a copy-paste).
    parsed = new URL(value.trim());
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  if (parsed.hostname !== "x.com" && parsed.hostname !== "twitter.com") return false;
  // Real X status IDs are 18-19 digits; require at least 15 so a
  // placeholder or truncated ID is rejected.
  return /^\/[^/]+\/status\/\d{15,}$/.test(parsed.pathname);
}

const sourcePath = join(BOT_DIR, POST_FILE);
let raw: string;
try {
  raw = readFileSync(sourcePath, "utf8");
} catch (err) {
  fail(`could not read ${sourcePath}: ${(err as Error).message}`);
}

let parsed: unknown;
try {
  parsed = JSON.parse(raw!);
} catch (err) {
  fail(`POST.json is not valid JSON: ${(err as Error).message}`);
}

if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
  fail("POST.json must be a JSON object like {\"url\": \"https://x.com/<handle>/status/<id>\"}");
}
const url = (parsed as Record<string, unknown>).url;
if (!isPostUrl(url)) {
  fail(
    "POST.json must name a post, e.g. {\"url\": \"https://x.com/<handle>/status/<id>\"} — " +
      "replace the placeholder with the real post address before submitting",
  );
}

mkdirSync(OUTPUT_DIR, { recursive: true });
try {
  copyFileSync(sourcePath, join(OUTPUT_DIR, POST_FILE));
} catch (err) {
  fail(`could not write ${join(OUTPUT_DIR, POST_FILE)}: ${(err as Error).message}`);
}
