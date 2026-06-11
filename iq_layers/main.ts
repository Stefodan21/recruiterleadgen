// Environment variables are provided by the runtime (CI / Docker / Kubernetes / GitHub Secrets).
// Do NOT load .env files in this project: secrets must be injected at runtime.

import FoundryClient from './foundry_client';
import parsePortfolio from './portfolio_adapter';
import normalizeCandidate from './candidate_normalizer';
import { upsertCandidate } from './database';

async function main() {
  const client = FoundryClient.fromEnv();
  const arg = process.argv[2];

  if (arg && /^https?:\/\//i.test(arg)) {
    console.log(`Parsing portfolio: ${arg}`);
    const parsed = await parsePortfolio(arg);
    const normalized = normalizeCandidate(parsed);
    console.log(JSON.stringify(normalized, null, 2));

    // Optionally write to Supabase if SUPABASE_URL is provided
    if (process.env.SUPABASE_URL) {
      try {
        const dbResp = await upsertCandidate(normalized);
        console.log('Database upsert result:', JSON.stringify(dbResp, null, 2));
      } catch (err: any) {
        console.error('Database upsert error:', err?.message || err);
      }
    }

    // Optionally send to Foundry if FOUNDRY_URL is provided
    if (process.env.FOUNDRY_URL) {
      try {
        const resp = await client.sendRaw(parsed);
        console.log('Foundry response:', JSON.stringify(resp, null, 2));
      } catch (err: any) {
        console.error('Foundry sendRaw error:', err?.message || err);
      }
    }
  } else {
    console.log('No portfolio URL provided.');
    console.log('Usage: npm run dev -- https://example.com/portfolio');

    // Demo ping to Foundry if available
    if (process.env.FOUNDRY_URL) {
      try {
        const resp = await client.sendRaw({ ping: true });
        console.log('Foundry ping response:', JSON.stringify(resp, null, 2));
      } catch (err: any) {
        console.error('Foundry ping failed:', err?.message || err);
      }
    }
  }
}

main().catch(err => {
  console.error('Fatal error in iq_layers main:', err?.message || err);
  process.exit(1);
});
