import { CandidateRecord } from './schema';

export function normalizeCandidate(raw: any): CandidateRecord {
  const id = raw?.id || raw?.email || raw?.emails?.[0] || raw?.name || undefined;
  const emails: string[] = raw?.emails && Array.isArray(raw.emails) ? raw.emails : raw?.email ? [raw.email] : [];

  const skills: string[] = (() => {
    if (!raw) return [];
    if (Array.isArray(raw.skills)) return raw.skills.map(String);
    if (typeof raw.skills === 'string') return raw.skills.split(/,|;|\n/).map((s: string) => s.trim()).filter(Boolean);
    return [];
  })();

  const projects = raw?.projects || [];

  const record: CandidateRecord = {
    id: String(id || ''),
    name: raw?.name || raw?.fullName || '',
    email: emails[0] || null,
    emails,
    phones: raw?.phones || [],
    github: raw?.github || raw?.links?.find((l: string) => /github\.com\//.test(l)) || undefined,
    linkedin: raw?.linkedin || raw?.links?.find((l: string) => /linkedin\.com\//.test(l)) || undefined,
    resume: raw?.resume || undefined,
    skills,
    projects,
    workflow_state: raw?.workflow_state || 'new',
    sources: raw?.sources || (raw?.source ? [raw.source] : []),
    confidence: typeof raw?.confidence === 'number' ? raw.confidence : raw?.confidence ? Number(raw.confidence) : 0,
    raw,
  };

  return record;
}

export default normalizeCandidate;
