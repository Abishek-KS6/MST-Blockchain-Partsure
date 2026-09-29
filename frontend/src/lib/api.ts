const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API Error');
  }
  return res.json();
}

export interface Stats {
  partCount: number;
  claimCount: number;
  orgCount: number;
  eventCount: number;
  openClaims: number;
  acceptedClaims: number;
  rejectedClaims: number;
}

export interface Org {
  id: string;
  name: string;
  role: string;
  walletAddress: string;
}

export interface Part {
  id: string;
  partId: string;
  partNumber: string;
  batchId: string;
  manufacturerOrgId: string;
  currentOwnerOrgId: string;
  installedMachine: string | null;
  status: string;
  warrantyUntil: string | null;
  chainTxHash: string | null;
  manufacturer: Org;
  currentOwner: Org;
  _count?: { events: number; claims: number };
  events?: PartEvent[];
  documents?: Document[];
  claims?: Claim[];
}

export interface PartEvent {
  id: string;
  partId: string;
  eventType: string;
  actorOrgId: string;
  payload: Record<string, unknown>;
  docHash: string | null;
  txHash: string | null;
  blockNumber: number | null;
  createdAt: string;
  actor: Org;
  part?: Part;
}

export interface Document {
  id: string;
  partId: string;
  docType: string;
  storagePath: string;
  sha256: string;
  uploadedByOrgId: string;
  extracted: Record<string, unknown> | null;
  extractionModel: string | null;
  confirmedAt: string | null;
  uploadedBy: Org;
}

export interface Claim {
  id: string;
  partId: string;
  status: string;
  failureDescription: string;
  ruleResults: RuleResult[];
  evidence: EvidencePacket;
  decidedByOrgId: string | null;
  decidedBy: Org | null;
  createdAt: string;
  part?: Part;
}

export interface RuleResult {
  rule: string;
  passed: boolean;
  detail: string;
}

export interface EvidencePacket {
  summary: string;
  timeline: string[];
  ruleFindings: RuleResult[];
  recommendedOutcome: 'accept' | 'reject';
  reasoning: string;
}

export const api = {
  getStats: () => fetchApi<Stats>('/stats'),
  getParts: () => fetchApi<Part[]>('/parts'),
  getPart: (partId: string) => fetchApi<Part>(`/parts/${partId}`),
  getClaims: () => fetchApi<Claim[]>('/claims'),
  getClaim: (id: string) => fetchApi<Claim>(`/claims/${id}`),
  getOrgs: () => fetchApi<Org[]>('/orgs'),
  getEvents: () => fetchApi<PartEvent[]>('/events'),
  fileClaim: (data: { partId: string; orgId: string; failureDate: string; operatingHours: number; docHash: string }) =>
    fetchApi<{ claimId: string; outcome: string; packet: EvidencePacket }>('/claims', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  resolveClaim: (id: string, accepted: boolean, docHash: string) =>
    fetchApi<{ status: string }>(`/claims/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ accepted, docHash }),
    }),
  createPart: (data: {
    partId: string;
    partNumber: string;
    batchId: string;
    manufacturerOrgId: string;
    currentOwnerOrgId: string;
    installedMachine?: string;
    warrantyMonths?: number;
  }) =>
    fetchApi<Part>('/parts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  createEvent: (data: {
    partId: string;
    eventType: string;
    actorOrgId: string;
    payload: Record<string, unknown>;
  }) =>
    fetchApi<PartEvent>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePart: (
    partId: string,
    data: {
      currentOwnerOrgId?: string;
      installedMachine?: string | null;
      status?: 'active' | 'failed' | 'retired';
      actorOrgId?: string;
      note?: string;
    }
  ) =>
    fetchApi<Part>(`/parts/${partId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};
