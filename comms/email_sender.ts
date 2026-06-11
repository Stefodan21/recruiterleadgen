import { createClient } from '@supabase/supabase-js';
import { sendEmail } from './brevo_client';
import { writeTracking } from './comms_tracking_writer';
import fs from 'fs';
import path from 'path';

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_KEY required');
  return createClient(url, key);
}

function loadTemplate(name = 'default.txt') {
  const p = path.join(__dirname, 'templates', name);
  try {
    return fs.readFileSync(p, 'utf8');
  } catch (err) {
    return 'Hi {{name}},\n\nWe saw your work and would like to connect.';
  }
}

function renderTemplate(template: string, data: Record<string, any>) {
  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) => {
    return String(data[key] ?? '');
  });
}

export async function run() {
  const supabase = getSupabase();

  // Fetch candidates not yet emailed (workflow_state != 'emailed')
  const { data: candidates, error } = await supabase
    .from('candidates')
    .select('*')
    .neq('workflow_state', 'emailed')
    .limit(100);
  if (error) throw error;
  if (!candidates || candidates.length === 0) {
    console.log('No candidates to email.');
    return;
  }

  const templateText = loadTemplate('default.txt');
  const templateHtml = loadTemplate('default.html');

  const trackingRecords: any[] = [];

  for (const c of candidates) {
    const toEmail = c.email || (Array.isArray(c.emails) && c.emails[0]);
    if (!toEmail) {
      console.warn('Skipping candidate with no email', c.id);
      continue;
    }

    const renderedText = renderTemplate(templateText, { name: c.name || '' });
    const renderedHtml = renderTemplate(templateHtml, { name: c.name || '' });

    const payload = {
      to: [{ email: toEmail, name: c.name }],
      subject: `Opportunity — ${c.name || 'candidate'}`,
      textContent: renderedText,
      htmlContent: renderedHtml,
      sender: { name: process.env.BREVO_SENDER_NAME, email: process.env.BREVO_SENDER_EMAIL },
    };

    let sent = false;
    let resp: any = null;
    try {
      resp = await sendEmail(payload as any);
      sent = true;
      // update candidate state
      await supabase.from('candidates').update({ workflow_state: 'emailed' }).eq('id', c.id);
    } catch (err: any) {
      console.error('Failed to send for', c.id, err?.message || err);
    }

    const record = {
      candidate_id: c.id,
      email: toEmail,
      sent: sent,
      response: resp || null,
      timestamp: new Date().toISOString(),
    };
    trackingRecords.push(record);
  }

  await writeTracking(trackingRecords);
}

if (require.main === module) {
  run().catch(err => {
    console.error('comms run error:', err?.message || err);
    process.exit(1);
  });
}

export default { run };
