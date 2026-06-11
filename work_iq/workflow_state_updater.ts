import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_KEY required');
  return createClient(url, key);
}

/**
 * Update workflow state for a candidate by a filter (e.g., email or id).
 */
export async function updateWorkflowState(filter: Record<string, any>, state: string) {
  const supabase = getSupabase();
  const query = supabase.from('candidates').update({ workflow_state: state });
  Object.entries(filter).forEach(([k, v]) => {
    query.eq(k, v as any);
  });
  const { data, error } = await query.select();
  if (error) throw error;
  return data;
}

/**
 * Insert meeting transcript or candidate file reference into `candidate_files` table.
 */
export async function insertTranscriptOrFile(payload: any) {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('candidate_files').insert(payload).select();
  if (error) throw error;
  return data;
}

export default { updateWorkflowState, insertTranscriptOrFile };
