import axios from 'axios';
import * as cheerio from 'cheerio';
import { CandidateRecord, ProjectInfo } from './schema';

function extractEmails(text: string): string[] {
  const re = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g;
  const matches = text.match(re) || [];
  return Array.from(new Set(matches));
}

export async function parsePortfolio(url: string): Promise<Partial<CandidateRecord>> {
  const result: Partial<CandidateRecord> = {};
  try {
    const resp = await axios.get(url, { timeout: 10000, headers: { 'User-Agent': 'recruiterleadgen-bot/1.0' } });
    const $ = cheerio.load(resp.data);

    // Heuristics for name
    const name = $('h1').first().text().trim() || $('title').text().trim();
    if (name) result.name = name;

    const text = $('body').text();
    const emails = extractEmails(text);
    if (emails.length) {
      result.emails = emails;
      result.email = emails[0];
    }

    const anchors = $('a')
      .map((i, el) => ({ href: $(el).attr('href') || '', text: $(el).text().trim() }))
      .get();

    const github = anchors.find(a => /github\.com\/.+/.test(a.href));
    if (github) result.github = github.href;

    const linkedin = anchors.find(a => /linkedin\.com\/(in|pub)\//.test(a.href));
    if (linkedin) result.linkedin = linkedin.href;

    const resume = anchors.find(a => /resume|cv|\.pdf/i.test(a.href) || /resume|cv/i.test(a.text));
    if (resume) result.resume = resume.href || resume.text;

    // Projects: gather meaningful anchor text+href pairs
    const projects: ProjectInfo[] = anchors
      .filter(a => a.text && a.href && !/^#/.test(a.href))
      .slice(0, 20)
      .map(a => ({ title: a.text, url: a.href }));

    if (projects.length) result.projects = projects;

    result.sources = [{ url }];
  } catch (err: any) {
    // Return a partial record with an error note in sources for traceability
    result.sources = result.sources || [];
    result.sources.push({ url, error: err?.message || String(err) });
  }

  return result;
}

export default parsePortfolio;
