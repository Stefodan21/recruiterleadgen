import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_KEY required');
  return createClient(url, key);
}

export async function writeTracking(records: any[]) {
  // Insert into supabase table 'comms_tracking' if present
  try {
    const supabase = getSupabase();
    await supabase.from('comms_tracking').insert(records);
  } catch (err) {
    // ignore DB errors but log
    console.warn('Supabase tracking insert failed:', err);
  }

  // Also write a local JSON file for workflow artifacts
  try {
    const out = path.join(process.cwd(), 'comms_tracking.json');
    fs.writeFileSync(out, JSON.stringify(records, null, 2));
  } catch (err) {
    console.warn('Failed to write comms_tracking.json:', err);
  }
}

export default { writeTracking };
