// main.ts
import { runCrawler } from "./crawler";
import { collectLinks } from "./link_collector";

async function main() {
  // 1. Define your search input
  const input = {
    role: ["software engineer", "developer", "full stack", "frontend", "backend"],
    location: ["florida", "miami"],
    skills: ["typescript", "react", "HTML", "CSS", "node.js"]
  };

  

  // 2. Run crawler on all queries
  const crawlerResults = await runCrawler(input);
  // debug: show counts of returned items per query to diagnose empty results
  try {
    const counts = crawlerResults.map((r: any) => {
      if (!r) return 0;
      if (Array.isArray(r.items)) return r.items.length;
      if (Array.isArray(r.results)) return r.results.length;
      return Object.keys(r).length;
    });
    console.log('Crawler results summary (items/results/objectKeys):', counts);
    if (crawlerResults.length > 0) console.log('Sample response for first query:', JSON.stringify(crawlerResults[0], null, 2).slice(0, 400));
  } catch (e) {
    console.warn('Failed to inspect crawlerResults', e);
  }
  
  // 3. Collect + dedupe + persist + output new links
  const newLinks = await collectLinks(crawlerResults);

  console.log("New links collected:", newLinks.length);
}

main().catch(err => {
  console.error("Pipeline failed:", err);
  process.exit(1);
});
