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
  
  // 3. Collect + dedupe + persist + output new links
  const newLinks = await collectLinks(crawlerResults);

  console.log("New links collected:", newLinks.length);
}

main().catch(err => {
  console.error("Pipeline failed:", err);
  process.exit(1);
});
