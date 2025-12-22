// link_collector.ts
import fs from "fs";
import path from "path";

const MAX_PER_HOST = 10;

// ---------------------------------------------
// Load persistent seen URLs
// ---------------------------------------------
function loadSeen(): Set<string> {
  const file = path.join(__dirname, "profile_links.json");

  if (!fs.existsSync(file)) {
    return new Set();
  }

  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    return new Set(data);
  } catch {
    return new Set();
  }
}

// ---------------------------------------------
// Save updated seen URLs
// ---------------------------------------------
function saveSeen(seen: Set<string>) {
  const file = path.join(__dirname, "profile_links.json");
  fs.writeFileSync(file, JSON.stringify([...seen], null, 2));
}

// ---------------------------------------------
// Local helpers
// ---------------------------------------------
function extractUrls(data: any): string[] {
  if (!data || !Array.isArray(data.results)) return [];
  return data.results.map(r => r.url).filter(Boolean);
}

function normalizeUrl(url: string): string | null {
  try {
    const u = new URL(url);
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
}

function boisFilter(url: string): boolean {
  const BLOCKED = [
    "wix.com",
    "wordpress.com",
    "blogspot.com",
    "medium.com",
    "template",
    "agency",
    "marketing",
    "shop",
    "store",
    "ecommerce"
  ];

  const lower = url.toLowerCase();
  return !BLOCKED.some(b => lower.includes(b));
}

// ---------------------------------------------
// MAIN FUNCTION — persistent dedupe
// ---------------------------------------------
export function collectLinks(results: Array<{ query: string; data: any }>) {
  const seen = loadSeen(); // persistent dedupe memory
  const freshLinks: string[] = [];

  for (const { data } of results) {
    const urls = extractUrls(data);

    const cleaned = urls
      .map(normalizeUrl)
      .filter(Boolean)
      .filter(url => boisFilter(url as string));

    const unique = Array.from(new Set(cleaned));
    const limited = unique.slice(0, MAX_PER_HOST);

    for (const url of limited) {
      if (!seen.has(url)) {
        freshLinks.push(url);
        seen.add(url);
      }
    }
  }

  // Save updated seen list
  saveSeen(seen);

  // Write artifact for ingestion
  fs.writeFileSync(
    path.join(__dirname, "new_links.json"),
    JSON.stringify(freshLinks, null, 2)
  );

  return freshLinks;
}
