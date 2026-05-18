import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, WebhookEvent } from '../api';

const thTd: React.CSSProperties = { padding: '12px 16px', textAlign: 'left' };

export default function Events() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);

  useEffect(() => { api.getEvents().then(setEvents); }, []);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--foreground)', marginBottom: 4 }}>
          Events
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
          Most recent 50 ingested events.
        </p>
      </div>

      {events.length === 0 ? (
        <div style={{
          border: '1px dashed var(--border)', borderRadius: 'var(--radius)',
          padding: '48px 0', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13,
        }}>
          No events ingested yet.
        </div>
      ) : (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
                {['ID', 'Type', 'Ingested'].map(h => (
                  <th key={h} style={{
                    ...thTd, fontSize: 12, fontWeight: 600,
                    color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((e, i) => (
                <tr
                  key={e.id}
                  style={{ borderBottom: i < events.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  <td style={{ ...thTd, fontFamily: 'monospace', fontSize: 12 }}>
                    <Link
                      to={`/events/${e.id}`}
                      style={{ color: 'var(--foreground)', fontWeight: 500, textDecoration: 'underline', textDecorationColor: 'var(--border)' }}
                    >
                      {e.id.slice(0, 8)}…
                    </Link>
                  </td>
                  <td style={thTd}>
                    <span style={{
                      background: 'var(--secondary)', color: 'var(--secondary-foreground)',
                      borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 500,
                    }}>
                      {e.type}
                    </span>
                  </td>
                  <td style={{ ...thTd, fontSize: 12, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                    {new Date(e.ingested_at).toLocaleString()}
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
