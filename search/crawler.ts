import { buildAllQueries } from "./bool_query";
import type { QueryInput } from "./bool_query";

async function runSearch(query: string) {
  const apiKey = process.env.GOOGLE_KEY;
  const cx = process.env.CX_ID;

  if (!apiKey || !cx) {
    throw new Error("Missing GOOGLE_KEY or CX_ID in environment variables");
  }

  const url =
    `https://www.googleapis.com/customsearch/v1` +
    `?key=${apiKey}` +
    `&cx=${cx}` +
    `&q=${encodeURIComponent(query)}`;

  // debug: show masked key/CX presence so we can confirm the runtime env
  try {
    console.log('Using GOOGLE_KEY=', apiKey ? apiKey.slice(0, 8) + '...' : 'MISSING', ' CX_ID=', cx ? cx : 'MISSING');
  } catch {}

  const res = await fetch(url);
  const text = await res.text();

  if (res.status !== 200) {
    console.error(`Google Custom Search returned HTTP ${res.status} for query: ${query}`);
    console.error('Response body:', text.slice(0, 1000));
  }

  try {
    return JSON.parse(text);
  } catch {
    console.error("❌ Google returned non‑JSON response for query:", query);
    console.error(text.slice(0, 200));
    throw new Error("Google Custom Search returned HTML instead of JSON");
  }
}

export async function runCrawler(input: QueryInput) {
  const queries = buildAllQueries(input);

  const tasks = queries.map(q => runSearch(q));
  return Promise.all(tasks);
}
