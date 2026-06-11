export interface ProjectInfo {
  title: string;
  url?: string;
}

export interface CandidateRecord {
  id?: string;
  name?: string;
  email?: string | null;
  emails?: string[];
  phones?: string[];
  github?: string;
  linkedin?: string;
  resume?: string;
  skills?: string[];
  projects?: ProjectInfo[];
  workflow_state?: 'new' | 'contacted' | 'screened' | 'interview' | 'hired' | string;
  sources?: any[];
  confidence?: number;
  raw?: any; // keep original raw payload for traceability
}

export default CandidateRecord;
