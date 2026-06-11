import axios from 'axios';
import { CandidateRecord } from './schema';

export class FoundryClient {
  baseUrl: string;
  apiKey?: string;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  static fromEnv(): FoundryClient {
    return new FoundryClient(process.env.FOUNDRY_URL || 'http://localhost:8080', process.env.FOUNDRY_API_KEY);
  }

  /**
   * Send raw site/candidate data to Foundry IQ and return normalized candidate records.
   * This method assumes the Foundry endpoint accepts JSON and returns an array of candidates.
   */
  async sendRaw(payload: any): Promise<CandidateRecord[]> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

    try {
      const resp = await axios.post(`${this.baseUrl.replace(/\/$/, '')}/normalize`, payload, { headers, timeout: 20000 });
      // Best-effort: try to return data as CandidateRecord[] and preserve raw response in each item
      const data = resp.data;
      if (Array.isArray(data)) return data as CandidateRecord[];
      if (data && data.results && Array.isArray(data.results)) return data.results as CandidateRecord[];
      // fallback: wrap single object
      return [data] as CandidateRecord[];
    } catch (err: any) {
      // Re-throw with helpful context
      const message = err?.response?.data || err?.message || String(err);
      throw new Error(`FoundryClient.sendRaw error: ${message}`);
    }
  }
}

export default FoundryClient;
