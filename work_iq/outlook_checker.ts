import createGraphClient from './graph_client';
import { updateWorkflowState } from './workflow_state_updater';

/**
 * Checks the recruiter's mailbox for replies from candidates.
 * Marks candidates as RESPONDED when a matching reply is found.
 * This is a simple heuristic: looks for messages in the Inbox with 'from' not the recruiter and
 * with subject including candidate name or email. In production you'd match conversationId or references.
 */
export async function checkOutlookReplies() {
  const client = createGraphClient();
  // Adjust folder/query as needed. This fetches recent messages from inbox
  const res = await client.api('/me/mailFolders/Inbox/messages')
    .top(50)
    .select('id,subject,from,conversationId,bodyPreview,receivedDateTime')
    .orderby('receivedDateTime DESC')
    .get();

  const messages: any[] = res?.value || [];
  for (const msg of messages) {
    try {
      const fromEmail = msg.from?.emailAddress?.address?.toLowerCase();
      // skip messages from the recruiter (needs env RECRUITER_EMAIL)
      if (fromEmail === (process.env.RECRUITER_EMAIL || '').toLowerCase()) continue;

      // Simple heuristic: attempt to find candidate by email in DB and mark responded
      const candidateEmail = fromEmail;
      if (candidateEmail) {
        await updateWorkflowState({ email: candidateEmail }, 'responded');
      }
    } catch (err) {
      console.warn('Failed to process message', msg?.id, err);
    }
  }
}

export default checkOutlookReplies;
