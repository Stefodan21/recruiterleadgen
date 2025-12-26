import fs from "fs";
import { Client as PgClient } from "pg";

async function main() {
  const inputPath = "/app/extracted-fields.json";

  if (!fs.existsSync(inputPath)) {
    throw new Error("extracted-fields.json not found");
  }

  const rows = JSON.parse(fs.readFileSync(inputPath, "utf8"));

  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error("POSTGRES_URL not set (Supabase connection string)");
  }

  const client = new PgClient({ connectionString });
  await client.connect();

  for (const row of rows) {
    await client.query(
      `INSERT INTO candidates (name, email, phone, linkedin_url, github_url)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name,
         phone = EXCLUDED.phone,
         linkedin_url = EXCLUDED.linkedin_url,
         github_url = EXCLUDED.github_url`,
      [
        row.name,
        row.email,
        row.phone,
        row.linkedin_url,
        row.github_url
      ]
    );
  }

  await client.end();
  console.log("Exported to Supabase Postgres");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
