import axios from 'axios';

const BREVO_ENDPOINT = 'https://api.sendinblue.com/v3/smtp/email';
const API_KEY = process.env.BREVO_API_KEY;

if (!API_KEY) {
  console.warn('BREVO_API_KEY not set; emails will fail until provided');
}

export interface EmailPayload {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent?: string;
  textContent?: string;
  sender?: { name?: string; email?: string };
}

export async function sendEmail(payload: EmailPayload) {
  if (!API_KEY) throw new Error('BREVO_API_KEY missing');
  const body: any = {
    to: payload.to,
    subject: payload.subject,
  };
  if (payload.htmlContent) body.htmlContent = payload.htmlContent;
  if (payload.textContent) body.textContent = payload.textContent;
  if (payload.sender) body.sender = payload.sender;

  const headers = {
    'Content-Type': 'application/json',
    'api-key': API_KEY,
  };

  const resp = await axios.post(BREVO_ENDPOINT, body, { headers, timeout: 15000 });
  return resp.data;
}

export default { sendEmail };
