import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";
import path from "path";

// FIX: new_links.json is a string[] array, not { url: string }
const urls: string[] = JSON.parse(fs.readFileSync("new_links.json", "utf-8")) as string[];

async function processUrl(url: string) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // Contact info extraction
    const emails: string[] = [];
    const phones: string[] = [];
    const linkedins: string[] = [];
    const githubs: string[] = [];

    // 1. Email (mailto links + regex fallback)
    $("a[href^='mailto:']").each((_, el) => {
      const email = $(el).attr("href")?.replace("mailto:", "");
      if (email) emails.push(email);
    });
    const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
    const textEmails = data.match(emailRegex);
    if (textEmails) emails.push(...textEmails);

    // 2. Phone numbers (basic regex)
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
    const textPhones = data.match(phoneRegex);
    if (textPhones) phones.push(...textPhones);

    // 3. LinkedIn URLs
    $("a[href*='linkedin.com']").each((_, el) => {
      const href = $(el).attr("href");
      if (href) linkedins.push(href);
    });

    // 4. GitHub URLs
    $("a[href*='github.com']").each((_, el) => {
      const href = $(el).attr("href");
      if (href) githubs.push(href);
    });

    // 5. Resume links (.pdf, .docx, .doc)
    // FIX: collect hrefs first, then await downloads outside .each()
    const resumes: string[] = [];
    const resumeHrefs: string[] = [];
    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (href && (href.endsWith(".pdf") || href.endsWith(".docx") || href.endsWith(".doc"))) {
        const resumeUrl = new URL(href, url).href;
        resumeHrefs.push(resumeUrl);
        resumes.push(resumeUrl);
      }
    });

    // FIX: await resume downloads sequentially, unique filenames
    for (const resumeUrl of resumeHrefs) {
      const res = await axios.get(resumeUrl, { responseType: "arraybuffer" });
      const filename = path.basename(new URL(resumeUrl).pathname) || "resume.pdf";
      fs.writeFileSync(filename, Buffer.from(res.data as ArrayBuffer));
    }

    // 6. Output structured JSON
    const result = {
      url,
      emails: [...new Set(emails)],
      phones: [...new Set(phones)],
      linkedins: [...new Set(linkedins)],
      githubs: [...new Set(githubs)],
      resumes,
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(`Error fetching ${url}:`, err);
  }
}

(async () => {
  for (const url of urls) {
    await processUrl(url);
  }
})();