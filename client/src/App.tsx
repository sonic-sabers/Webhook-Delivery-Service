import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Subscriptions from './pages/Subscriptions';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';

export default function App() {
  return (
    <div style={{ fontFamily: 'monospace', padding: '1rem' }}>
      <nav style={{ marginBottom: '1rem' }}>
        <NavLink to="/subscriptions" style={{ marginRight: '1rem' }}>Subscriptions</NavLink>
        <NavLink to="/events">Events</NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<Navigate to="/subscriptions" />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
      </Routes>
    </div>
  );
}
