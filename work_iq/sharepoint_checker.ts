import createGraphClient from './graph_client';
import { insertTranscriptOrFile, updateWorkflowState } from './workflow_state_updater';

/**
 * Checks SharePoint sites for new files (resumes) uploaded by candidates.
 * This is a stub that lists recent drives for the authenticated user — adapt to your SharePoint structure.
 */
export async function checkSharePoint() {
  const client = createGraphClient();

  try {
    const res = await client.api('/me/drives').get();
    const drives = res?.value || [];
    for (const d of drives) {
      // In a real implementation you'd enumerate drive/root/children and inspect file metadata
      // For each found candidate file, you could call insertTranscriptOrFile or updateWorkflowState
      // Example placeholder:
      // await insertTranscriptOrFile({ candidate_id: 'unknown', type: 'resume', url: d.webUrl });
    }
  } catch (err) {
    console.warn('SharePoint check failed', err);
  }
}

export default checkSharePoint;
