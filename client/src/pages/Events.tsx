import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, WebhookEvent } from '../api';

export default function Events() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);

  useEffect(() => { api.getEvents().then(setEvents); }, []);

  return (
    <div>
      <h2>Recent Events (last 50)</h2>
      <table border={1} cellPadding={6}>
        <thead>
          <tr><th>ID</th><th>Type</th><th>Ingested</th></tr>
        </thead>
        <tbody>
          {events.map(e => (
            <tr key={e.id}>
              <td><Link to={`/events/${e.id}`}>{e.id.slice(0, 8)}…</Link></td>
              <td>{e.type}</td>
              <td>{new Date(e.ingested_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
