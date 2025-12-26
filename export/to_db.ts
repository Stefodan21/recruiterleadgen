import fs from "fs";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const inputPath = "/app/extracted-fields.json";

  if (!fs.existsSync(inputPath)) {
    throw new Error("extracted-fields.json not found");
  }

  const rows = JSON.parse(fs.readFileSync(inputPath, "utf8"));

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("SUPABASE_URL not set");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY not set");

  const supabase = createClient(url, key);

  for (const row of rows) {
    const { error } = await supabase
      .from("candidates")
      .upsert(
        {
          name: row.name,
          email: row.email,
          phone: row.phone,
          linkedin_url: row.linkedin_url,
          github_url: row.github_url
        },
        { onConflict: "email" }
      );

    if (error) {
      console.error("Error inserting row:", row.email, error);
    } else {
      console.log("Upserted:", row.email);
    }
  }

  console.log("Supabase export complete");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
