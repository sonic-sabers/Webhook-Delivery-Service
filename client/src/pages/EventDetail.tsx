import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, DeliveryAttempt, WebhookEvent } from '../api';

type EventWithAttempts = WebhookEvent & { attempts: DeliveryAttempt[] };

const STATUS_COLOR: Record<string, string> = {
  delivered: 'green',
  failed: 'red',
  dead: 'darkred',
  pending: 'orange',
  in_flight: 'blue',
};

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<EventWithAttempts | null>(null);
  const [error, setError] = useState('');

  const load = () =>
    api.getEvent(id!).then(setData).catch(e => setError(String(e)));

  useEffect(() => { load(); }, [id]);

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!data) return <p>Loading…</p>;

  const retry = async (attemptId: string) => {
    await api.retryAttempt(data.id, attemptId);
    load();
  };

  return (
    <div>
      <h2>Event: {data.id}</h2>
      <p><strong>Type:</strong> {data.type}</p>
      <p><strong>Ingested:</strong> {new Date(data.ingested_at).toLocaleString()}</p>
      <pre style={{ background: '#f0f0f0', padding: '0.5rem', overflowX: 'auto' }}>
        {JSON.stringify(JSON.parse(data.payload), null, 2)}
      </pre>
      <h3>Delivery Attempts</h3>
      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>Attempt #</th>
            <th>Subscription</th>
            <th>Status</th>
            <th>HTTP Code</th>
            <th>Error</th>
            <th>Next Retry</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data.attempts.map(a => (
            <tr key={a.id}>
              <td>{a.attempt_number}</td>
              <td>{a.subscription_id.slice(0, 8)}…</td>
              <td style={{ color: STATUS_COLOR[a.status] ?? 'black', fontWeight: 'bold' }}>
                {a.status}
              </td>
              <td>{a.last_status_code ?? '—'}</td>
              <td>{a.last_error ?? '—'}</td>
              <td>
                {a.status === 'pending'
                  ? new Date(a.next_attempt_at).toLocaleString()
                  : '—'}
              </td>
              <td>
                {(a.status === 'dead' || a.status === 'failed') && (
                  <button onClick={() => retry(a.id)}>Retry</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
