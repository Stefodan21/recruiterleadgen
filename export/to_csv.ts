import fs from "fs";
import { createObjectCsvWriter } from "csv-writer";

async function main() {
  const inputPath = "/app/extracted-fields.json";
  const outputPath = "/app/output.csv";

  if (!fs.existsSync(inputPath)) {
    throw new Error("extracted-fields.json not found");
  }

  const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));

  const csvWriter = createObjectCsvWriter({
    path: outputPath,
    header: [
      { id: "name", title: "Name" },
      { id: "email", title: "Email" },
      { id: "phone", title: "Phone" },
      { id: "linkedin_url", title: "LinkedIn" },
      { id: "github_url", title: "GitHub" }
    ]
  });

  await csvWriter.writeRecords(data);

  console.log("CSV export complete → output.csv");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
