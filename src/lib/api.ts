export const API_BASE_KEY = 'hakein.apiBase';
export const USER_ID_KEY = 'hakein.userId';
export const PROVIDER_KEY = 'hakein.provider';
export const API_KEY_KEY = 'hakein.aiKey';

export function getApiBase(): string {
  return (
    localStorage.getItem(API_BASE_KEY) ||
    (import.meta as unknown as { env: Record<string, string> }).env?.VITE_API_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

export function getUserId(): string {
  return localStorage.getItem(USER_ID_KEY) || '';
}

export function getProvider(): string {
  return localStorage.getItem(PROVIDER_KEY) || 'gemini';
}

export function getAiKey(): string {
  return localStorage.getItem(API_KEY_KEY) || '';
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    const msg = (body as { error?: string })?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return body as T;
}

export const api = {
  health: () => req<{ status: string; timestamp: string }>('/api/health'),
  generateResume: (payload: Record<string, unknown>) =>
    req<{ id: string; resume: string; analysis: unknown; atsScore: AtsScore; metadata: unknown }>('/api/resume/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  extractJd: (url: string) =>
    req<{ jobDescription: string }>('/api/resume/extract-jd', { method: 'POST', body: JSON.stringify({ url }) }),
  tailorPublic: (payload: { resumeText: string; jobInput: { type: 'jd'; content: string } | { type: 'url'; url: string } }) =>
    req<{ id: string; resume: string; atsScore: AtsScore }>('/api/resume/tailor-public', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  analyzeAts: (payload: Record<string, unknown>) =>
    req<AtsScore>('/api/resume/analyze-ats', { method: 'POST', body: JSON.stringify(payload) }),

  createUser: (payload: Record<string, unknown>) =>
    req<{ id: string; email: string }>('/api/users', { method: 'POST', body: JSON.stringify(payload) }),
  getUser: (id: string) => req<UserDetail>(`/api/users/${id}`),
  saveCredentials: (id: string, payload: Record<string, unknown>) =>
    req<{ ok: boolean }>(`/api/users/${id}/credentials`, { method: 'PATCH', body: JSON.stringify(payload) }),
  verifyCredentials: (id: string, payload: Record<string, unknown>) =>
    req<{ ok: boolean; error?: string }>(`/api/users/${id}/verify-credentials`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  saveQaProfile: (id: string, payload: Record<string, unknown>) =>
    req<{ ok: boolean; qaProfile: Record<string, unknown> }>(`/api/users/${id}/qa-profile`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  addQa: (id: string, payload: Record<string, unknown>) =>
    req<{ ok: boolean; id: string }>(`/api/users/${id}/qa`, { method: 'POST', body: JSON.stringify(payload) }),
  getQa: (id: string) => req<{ qaProfile: Record<string, unknown>; answers: QaAnswer[] }>(`/api/users/${id}/qa`),
  answerPreview: (id: string, payload: Record<string, unknown>) =>
    req<{ answer: string | null; source: string; confidence?: string; error?: string }>(
      `/api/users/${id}/answer-preview`,
      { method: 'POST', body: JSON.stringify(payload) },
    ),
  savePreferences: (id: string, payload: Record<string, unknown>) =>
    req(`/api/users/${id}/preferences`, { method: 'PATCH', body: JSON.stringify(payload) }),

  scrapeJobs: (payload: Record<string, unknown>) =>
    req<{ inserted?: number; jobs: Job[]; logs: unknown }>('/api/jobs/scrape', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  listJobs: (params: { source?: string; limit?: number; q?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.source) sp.set('source', params.source);
    if (params.limit) sp.set('limit', String(params.limit));
    if (params.q) sp.set('q', params.q);
    const qs = sp.toString();
    return req<{ count: number; jobs: Job[] }>(`/api/jobs${qs ? `?${qs}` : ''}`);
  },
  matches: (userId: string) => req<{ count: number; jobs: Job[] }>(`/api/jobs/matches/${userId}`),
  autoApply: (payload: Record<string, unknown>) =>
    req<{ queued: boolean; jobId: string; dryRun: boolean }>('/api/applications/auto-apply', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  listApplications: (userId: string) =>
    req<{ count: number; applications: Application[] }>(`/api/applications/user/${userId}`),
  retryApplication: (appId: string, payload: Record<string, unknown> = {}) =>
    req<{ queued: boolean; jobId: string }>(`/api/applications/${appId}/retry`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  inbox: (userId: string) =>
    req<{ count: number; items: InboxItem[] }>(`/api/users/${userId}/inbox`),
  answerInbox: (userId: string, qid: string, payload: Record<string, unknown>) =>
    req<{ ok: boolean; retried: boolean; remainingForApp: number }>(
      `/api/users/${userId}/inbox/${qid}/answer`,
      { method: 'POST', body: JSON.stringify(payload) },
    ),
};

export interface InboxItem {
  id: string;
  question: string;
  fieldType: string;
  options?: string[];
  source: string;
  status: string;
  createdAt: string;
  job?: { id: string; title: string; company: string; url: string; source: string } | null;
}

export interface AtsScore {
  score: number;
  breakdown?: Record<string, number>;
  missingKeywords?: string[];
  recommendations?: string[];
}

export interface Job {
  id: string;
  source: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  postedAt: string;
}

export interface Application {
  id: string;
  status: string;
  error?: string;
  appliedAt?: string;
  createdAt: string;
  job: Job;
  response?: Record<string, unknown>;
}

export interface QaAnswer {
  id: string;
  question: string;
  answer: string;
  source: string;
  updatedAt: string;
}

export interface UserDetail {
  id: string;
  email: string;
  name?: string;
  profile: Record<string, unknown>;
  preferences: {
    keywords: string[];
    locations: string[];
    roles: string[];
    autoApply: boolean;
    easyApplyOnly: boolean;
    sources: string[];
    autoAnswerMode?: 'assisted' | 'full-auto';
    notifyEmail?: string;
    notifyTopic?: string;
  };
  linkedinEmail?: string;
  naukriEmail?: string;
  applications?: Application[];
}
