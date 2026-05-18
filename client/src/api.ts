const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY ?? 'secret';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      'content-type': 'application/json',
      'x-admin-key': ADMIN_KEY,
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export interface Subscription {
  id: string;
  url: string;
  secret: string | null;
  event_types: string;
  created_at: number;
  active: number;
}

export interface WebhookEvent {
  id: string;
  type: string;
  payload: string;
  ingested_at: number;
}

export interface DeliveryAttempt {
  id: string;
  event_id: string;
  subscription_id: string;
  status: string;
  attempt_number: number;
  max_attempts: number;
  next_attempt_at: number;
  claimed_at: number | null;
  last_status_code: number | null;
  last_error: string | null;
  delivered_at: number | null;
  created_at: number;
}

export const api = {
  getSubscriptions: () => apiFetch<Subscription[]>('/api/subscriptions'),
  createSubscription: (body: { url: string; secret?: string; event_types: string[] }) =>
    apiFetch<Subscription>('/api/subscriptions', { method: 'POST', body: JSON.stringify(body) }),
  deleteSubscription: (id: string) =>
    apiFetch<void>(`/api/subscriptions/${id}`, { method: 'DELETE' }),

  getEvents: () => apiFetch<WebhookEvent[]>('/api/events'),
  getEvent: (id: string) =>
    apiFetch<WebhookEvent & { attempts: DeliveryAttempt[] }>(`/api/events/${id}`),
  retryAttempt: (eventId: string, attemptId: string) =>
    apiFetch<{ queued: boolean }>(`/api/events/${eventId}/retry`, {
      method: 'POST',
      body: JSON.stringify({ attemptId }),
    }),
};
