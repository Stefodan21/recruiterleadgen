// -----------------------------
// Types
// -----------------------------
export interface QueryInput {
  role: string;
  skills: string[];
  location: string;
}

// -----------------------------
// High-signal hosting providers
// -----------------------------
const highSignalSites = [
  "vercel.app",
  "netlify.app",
  "github.io",
  "gitlab.io",
  "pages.dev",
  "web.app",
  "firebaseapp.com",
  "surge.sh",
  "repl.co"
];

// -----------------------------
// Base query builder (for hosts)
// -----------------------------
export function buildQuery(input: QueryInput, site: string): string {
  const skillPart = `(${input.skills.join(" OR ")})`;

  return `site:${site} "${input.role}" ${skillPart} "${input.location}"`;
}

// -----------------------------
// .dev portfolio-optimized query
// -----------------------------
export function buildDevQuery(input: QueryInput): string {
  const skillPart = `(${input.skills.join(" OR ")})`;

  // Portfolio-specific keywords to reduce noise
  const portfolioKeywords = `("portfolio" OR "projects" OR "about me" OR "resume" 
                              OR "about-me" OR "about_me" OR "portfolio" OR "work")`;

  return `site:dev "${input.role}" ${skillPart} "${input.location}" ${portfolioKeywords}`;
}

// -----------------------------
// Build all queries (Tier 1 + .dev Tier 2)
// -----------------------------
export function buildAllQueries(input: QueryInput): string[] {
  const baseQueries = highSignalSites.map(site => buildQuery(input, site));
  const devQuery = buildDevQuery(input);

  return [...baseQueries, devQuery];
}
