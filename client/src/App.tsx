import React from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import Subscriptions from "./pages/Subscriptions";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";

export default function App() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          gap: 32,
          height: 56,
          position: "sticky",
          top: 0,
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(8px)",
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontWeight: 700,
            fontSize: 15,
            color: "var(--foreground)",
            letterSpacing: "-0.3px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          Webhook Service
        </span>
        <nav style={{ display: "flex", gap: 2 }}>
          {[
            { to: "/subscriptions", label: "Subscriptions" },
            { to: "/events", label: "Events" },
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                padding: "5px 12px",
                borderRadius: "calc(var(--radius) - 2px)",
                fontSize: 13,
                fontWeight: 500,
                color: isActive
                  ? "var(--foreground)"
                  : "var(--muted-foreground)",
                background: isActive ? "var(--secondary)" : "transparent",
                transition: "all 0.15s",
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main style={{ padding: "32px", maxWidth: 1100, margin: "0 auto" }}>
        <Routes>
          <Route path="/" element={<Navigate to="/subscriptions" />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />
        </Routes>
      </main>
    </div>
  );
}
