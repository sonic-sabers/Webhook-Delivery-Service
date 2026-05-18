import React, { useEffect, useState } from 'react';
import { api, Subscription } from '../api';

export default function Subscriptions() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [types, setTypes] = useState('*');
  const [error, setError] = useState('');

  const load = () =>
    api.getSubscriptions().then(setSubs).catch(e => setError(String(e)));

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.createSubscription({
        url,
        secret: secret || undefined,
        event_types: types.split(',').map(t => t.trim()).filter(Boolean),
      });
      setUrl(''); setSecret(''); setTypes('*');
      load();
    } catch (err) { setError(String(err)); }
  };

  const remove = async (id: string) => {
    try {
      await api.deleteSubscription(id);
      load();
    } catch (err) { setError(String(err)); load(); }
  };

  return (
    <div>
      <h2>Subscriptions</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={create} style={{ marginBottom: '1rem' }}>
        <input
          placeholder="https://your-server.com/webhook"
          value={url}
          onChange={e => setUrl(e.target.value)}
          required
          style={{ marginRight: 4, width: 280 }}
        />
        <input
          placeholder="Secret (optional)"
          value={secret}
          onChange={e => setSecret(e.target.value)}
          style={{ marginRight: 4 }}
        />
        <input
          placeholder="Event types e.g. order.*, user.created"
          value={types}
          onChange={e => setTypes(e.target.value)}
          style={{ marginRight: 4, width: 280 }}
        />
        <button type="submit">Create</button>
      </form>
      <table border={1} cellPadding={6}>
        <thead>
          <tr><th>ID</th><th>URL</th><th>Event Types</th><th>Created</th><th></th></tr>
        </thead>
        <tbody>
          {subs.map(s => (
            <tr key={s.id}>
              <td>{s.id.slice(0, 8)}…</td>
              <td>{s.url}</td>
              <td>{s.event_types}</td>
              <td>{new Date(s.created_at).toLocaleString()}</td>
              <td><button onClick={() => remove(s.id)}>Disable</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
