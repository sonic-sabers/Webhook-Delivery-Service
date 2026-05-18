import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, DeliveryAttempt, WebhookEvent } from '../api';

type EventWithAttempts = WebhookEvent & { attempts: DeliveryAttempt[] };

const STATUS: Record<string, { color: string; bg: string; border: string; label: string }> = {
  delivered: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Delivered' },
  failed:    { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Failed' },
  dead:      { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', label: 'Dead' },
  pending:   { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Pending' },
  in_flight: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: 'In Flight' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { color: 'var(--muted-foreground)', bg: 'var(--muted)', border: 'var(--border)', label: status };
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 500,
    }}>
      {s.label}
    </span>
  );
}

const thTd: React.CSSProperties = { padding: '12px 16px', textAlign: 'left' };

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<EventWithAttempts | null>(null);
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState<string | null>(null);

  const load = () =>
    api.getEvent(id!).then(setData).catch(e => setError(String(e)));

  useEffect(() => { load(); }, [id]);

  const retry = async (attemptId: string) => {
    setRetrying(attemptId);
    try {
      await api.retryAttempt(data!.id, attemptId);
      load();
    } finally {
      setRetrying(null);
    }
  };

  if (error) return (
    <div style={{
      background: '#fef2f2', border: '1px solid #fecaca',
      color: '#dc2626', borderRadius: 'var(--radius)', padding: '12px 16px', fontSize: 13,
    }}>{error}</div>
  );

  if (!data) return (
    <div style={{ color: 'var(--muted-foreground)', padding: '48px 0', textAlign: 'center', fontSize: 13 }}>
      Loading…
    </div>
  );

  return (
    <div>
      {/* Back */}
      <Link to="/events" style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 20,
      }}>
        ← Back to Events
      </Link>

      {/* Event card */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: 24, marginBottom: 24,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{
            background: 'var(--secondary)', color: 'var(--secondary-foreground)',
            borderRadius: 4, padding: '3px 10px', fontSize: 13, fontWeight: 600,
          }}>
            {data.type}
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--muted-foreground)' }}>
            {data.id}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted-foreground)' }}>
            {new Date(data.ingested_at).toLocaleString()}
          </span>
        </div>

        <pre style={{
          background: 'var(--muted)', border: '1px solid var(--border)',
          borderRadius: 'calc(var(--radius) - 2px)',
          padding: 16, fontSize: 12, fontFamily: 'monospace',
          color: 'var(--foreground)', overflowX: 'auto',
          lineHeight: 1.6, margin: 0,
        }}>
          {JSON.stringify(JSON.parse(data.payload), null, 2)}
        </pre>
      </div>

      {/* Attempts */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--foreground)' }}>
          Delivery Attempts
        </h2>
        <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
          {data.attempts.length}
        </span>
      </div>

      {data.attempts.length === 0 ? (
        <div style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>No delivery attempts.</div>
      ) : (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
                {['#', 'Subscription', 'Status', 'HTTP', 'Error', 'Next Retry', ''].map(h => (
                  <th key={h} style={{
                    ...thTd, fontSize: 12, fontWeight: 600,
                    color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.attempts.map((a, i) => (
                <tr key={a.id} style={{ borderBottom: i < data.attempts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ ...thTd, color: 'var(--muted-foreground)', fontSize: 13 }}>
                    {a.attempt_number + 1}
                  </td>
                  <td style={{ ...thTd, fontFamily: 'monospace', fontSize: 12, color: 'var(--muted-foreground)' }}>
                    {a.subscription_id.slice(0, 8)}…
                  </td>
                  <td style={thTd}>
                    <StatusBadge status={a.status} />
                  </td>
                  <td style={{ ...thTd, fontSize: 13, color: a.last_status_code ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                    {a.last_status_code ?? '—'}
                  </td>
                  <td style={{ ...thTd, fontSize: 12, color: '#dc2626', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.last_error ?? <span style={{ color: 'var(--muted-foreground)' }}>—</span>}
                  </td>
                  <td style={{ ...thTd, fontSize: 12, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                    {a.status === 'pending' ? new Date(a.next_attempt_at).toLocaleString() : '—'}
                  </td>
                  <td style={thTd}>
                    {(a.status === 'dead' || a.status === 'failed') && (
                      <button
                        onClick={() => retry(a.id)}
                        disabled={retrying === a.id}
                        style={{
                          background: 'var(--secondary)', color: 'var(--secondary-foreground)',
                          border: '1px solid var(--border)', fontSize: 12, padding: '5px 12px',
                        }}
                      >
                        {retrying === a.id ? 'Queuing…' : 'Retry'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
