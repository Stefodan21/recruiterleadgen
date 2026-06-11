import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { CandidateRecord } from './schema';

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_KEY must be set in the environment');
  }
  _supabase = createClient(url, key);
  return _supabase;
}

/**
 * Upsert a candidate into the `candidates` table.
 * The table should have columns that match the keys used below (id primary key, email, name, skills jsonb, raw jsonb, etc.).
 */
export async function upsertCandidate(candidate: CandidateRecord) {
  const supabase = getSupabase();
  const payload = {
    id: candidate.id || null,
    name: candidate.name || null,
    email: candidate.email || null,
    emails: candidate.emails || null,
    phones: candidate.phones || null,
    github: candidate.github || null,
    linkedin: candidate.linkedin || null,
    resume: candidate.resume || null,
    skills: candidate.skills || null,
    projects: candidate.projects || null,
    workflow_state: candidate.workflow_state || null,
    sources: candidate.sources || null,
    confidence: candidate.confidence || null,
    raw: candidate.raw || null,
  };

  const { data, error } = await supabase.from('candidates').upsert(payload, { onConflict: 'id' }).select();
  if (error) throw error;
  return data;
}

export async function insertRaw(table: string, payload: any) {
  const supabase = getSupabase();
  const { data, error } = await supabase.from(table).insert(payload).select();
  if (error) throw error;
  return data;
}

export default {
  getSupabase,
  upsertCandidate,
  insertRaw,
};
