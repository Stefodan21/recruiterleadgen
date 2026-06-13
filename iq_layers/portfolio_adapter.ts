import axios from 'axios';
import * as cheerio from 'cheerio';
import pdfParse from 'pdf-parse';
import { CandidateRecord, ProjectInfo } from './schema';

function extractPhones(text: string): string[] {
  // Match common international and local phone formats
  const re = /(?:\+?\d{1,3}[\s-.])?(?:\(\d{2,4}\)|\d{2,4})[\s-.]?\d{2,4}[\s-.]?\d{2,4}(?:[\s-.]\d{1,4})?/g;
  const matches = text.match(re) || [];
  // normalize whitespace and punctuation
  const cleaned = matches.map(m => m.replace(/[\s-.]+/g, ' ').trim());
  return Array.from(new Set(cleaned)).slice(0, 5);
}

function extractNameFromText(text: string, emails: string[] = []): string | undefined {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // 1) Lines with explicit labels: Name:, Full Name:, Candidate:
  for (const line of lines) {
    const m = line.match(/(?:Name|Full Name|Candidate)[:\-]\s*(.+)/i);
    if (m && m[1]) return m[1].trim();
  }

  // 2) If we have an email, look for nearby lines (above) that look like a name
  if (emails.length) {
    const email = emails[0];
    const idx = lines.findIndex(l => l.includes(email));
    if (idx > 0) {
      // check up to 3 lines above for a plausible name
      for (let i = Math.max(0, idx - 3); i < idx; i++) {
        const candidate = lines[i];
        if (/^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(candidate)) return candidate;
      }
    }
  }

  // 3) First line that looks like a personal name (Two capitalized words)
  for (const line of lines.slice(0, 10)) {
    if (/^[A-Z][a-z]{1,}\s+[A-Z][a-z]{1,}(?:\s+[A-Z][a-z]{1,})?$/.test(line)) return line;
  }

  return undefined;
}

function extractEmails(text: string): string[] {
  const re = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g;
  const matches = text.match(re) || [];
  return Array.from(new Set(matches));
}

export async function parsePortfolio(url: string): Promise<Partial<CandidateRecord>> {
  const result: Partial<CandidateRecord> = {};
  try {
    const resp = await axios.get(url, { timeout: 20000, responseType: 'arraybuffer', headers: { 'User-Agent': 'recruiterleadgen-bot/1.0' } });
    const contentType = String(resp.headers['content-type'] || '').toLowerCase();

    let text = '';

    if (contentType.includes('pdf') || url.toLowerCase().endsWith('.pdf')) {
      // PDF: extract text
      try {
        const data = await pdfParse(resp.data);
        text = data.text || '';
      } catch (pdfErr: any) {
        text = Buffer.from(resp.data).toString('utf8');
      }

      const emails = extractEmails(text);
      if (emails.length) {
        result.emails = emails;
        result.email = emails[0];
      }

      // Attempt to extract phone numbers and name from PDF text
      const phones = extractPhones(text);
      if (phones.length) result.phones = phones;

      const inferredName = extractNameFromText(text, result.emails || []);
      if (inferredName) result.name = inferredName;
    } else {
      const html = Buffer.from(resp.data).toString('utf8');
      const $ = cheerio.load(html);

      // Heuristics for name
      const name = $('h1').first().text().trim() || $('title').text().trim();
      if (name) result.name = name;

      text = $('body').text();

      const anchors = $('a')
        .map((i, el) => ({ href: $(el).attr('href') || '', text: $(el).text().trim() }))
        .get();

      const github = anchors.find(a => /github\.com\/.+/.test(a.href));
      if (github) result.github = github.href;

      const linkedin = anchors.find(a => /linkedin\.com\/(in|pub)\//.test(a.href));
      if (linkedin) result.linkedin = linkedin.href;

      const resume = anchors.find(a => /resume|cv|\.pdf/i.test(a.href) || /resume|cv/i.test(a.text));
      if (resume) result.resume = resume.href || resume.text;

      const projects: ProjectInfo[] = anchors
        .filter(a => a.text && a.href && !/^#/.test(a.href))
        .slice(0, 20)
        .map(a => ({ title: a.text, url: a.href }));

      if (projects.length) result.projects = projects;
    }

    // Extract emails from accumulated text if not already set
    if (!result.emails) {
      const emails = extractEmails(text);
      if (emails.length) {
        result.emails = emails;
        result.email = emails[0];
      }
    }

    // Extract phones and try to infer name from HTML text if missing
    if (!result.phones) {
      const phones = extractPhones(text);
      if (phones.length) result.phones = phones;
    }

    if (!result.name) {
      const inferred = extractNameFromText(text, result.emails || []);
      if (inferred) result.name = inferred;
    }

    result.sources = [{ url }];
  } catch (err: any) {
    result.sources = result.sources || [];
    result.sources.push({ url, error: err?.message || String(err) });
  }

  return result;
}

export default parsePortfolio;
