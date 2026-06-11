import { ConfidentialClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';

// Initializes MSAL confidential client and returns an authenticated Graph client
export function createGraphClient(): Client {
  const clientId = process.env.MSAL_CLIENT_ID;
  const tenantId = process.env.MSAL_TENANT_ID;
  const clientSecret = process.env.MSAL_CLIENT_SECRET;

  if (!clientId || !tenantId || !clientSecret) {
    throw new Error('MSAL_CLIENT_ID, MSAL_TENANT_ID and MSAL_CLIENT_SECRET must be set');
  }

  const msalConfig = {
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      clientSecret,
    },
  } as any;

  const cca = new ConfidentialClientApplication(msalConfig);

  // Simple auth provider that acquires token on demand
  const authProvider = async (done: any) => {
    try {
      const result = await cca.acquireTokenByClientCredential({ scopes: ['https://graph.microsoft.com/.default'] });
      if (!result || !result.accessToken) throw new Error('Failed to acquire token');
      done(null, result.accessToken);
    } catch (err) {
      done(err, null);
    }
  };

  const client = Client.initWithMiddleware({ authProvider });
  return client;
}

export default createGraphClient;
