import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api, WebhookEvent } from "../api";

const thTd: React.CSSProperties = { padding: "12px 16px", textAlign: "left" };

export default function Events() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setRefreshing(true);
    api
      .getEvents()
      .then((data) => {
        setEvents(data);
        setLastUpdated(new Date());
      })
      .finally(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "var(--foreground)",
              marginBottom: 4,
            }}
          >
            Events
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
            Most recent 50 ingested events.
            {lastUpdated && (
              <span style={{ marginLeft: 8, fontSize: 12 }}>
                Last updated: {lastUpdated.toLocaleTimeString()}
                {refreshing && <span style={{ marginLeft: 4 }}>⟳</span>}
              </span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={load}
            disabled={refreshing}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              background: "var(--secondary)",
              color: "var(--secondary-foreground)",
            }}
          >
            {refreshing ? "⟳" : "↻ Refresh"}
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <div
          style={{
            border: "1px dashed var(--border)",
            borderRadius: "var(--radius)",
            padding: "48px 0",
            textAlign: "center",
            color: "var(--muted-foreground)",
            fontSize: 13,
          }}
        >
          No events ingested yet.
        </div>
      ) : (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--border)",
                  background: "var(--muted)",
                }}
              >
                {["ID", "Type", "Deliveries", "Ingested"].map((h) => (
                  <th
                    key={h}
                    style={{
                      ...thTd,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--muted-foreground)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((e, i) => (
                <tr
                  key={e.id}
                  style={{
                    borderBottom:
                      i < events.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                  }}
                >
                  <td
                    style={{ ...thTd, fontFamily: "monospace", fontSize: 12 }}
                  >
                    <Link
                      to={`/events/${e.id}`}
                      style={{
                        color: "var(--foreground)",
                        fontWeight: 500,
                        textDecoration: "underline",
                        textDecorationColor: "var(--border)",
                      }}
                    >
                      {e.id.slice(0, 8)}…
                    </Link>
                  </td>
                  <td style={thTd}>
                    <span
                      style={{
                        background: "var(--secondary)",
                        color: "var(--secondary-foreground)",
                        borderRadius: 4,
                        padding: "2px 8px",
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      {e.type}
                    </span>
                  </td>
                  <td style={thTd}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {e.delivered > 0 && (
                        <span
                          style={{
                            background: "#dcfce7",
                            color: "#166534",
                            borderRadius: 4,
                            padding: "2px 6px",
                            fontSize: 11,
                            fontWeight: 500,
                          }}
                        >
                          ✓ {e.delivered}
                        </span>
                      )}
                      {e.pending > 0 && (
                        <span
                          style={{
                            background: "#fef3c7",
                            color: "#92400e",
                            borderRadius: 4,
                            padding: "2px 6px",
                            fontSize: 11,
                            fontWeight: 500,
                          }}
                        >
                          ⏳ {e.pending}
                        </span>
                      )}
                      {e.failed > 0 && (
                        <span
                          style={{
                            background: "#fee2e2",
                            color: "#991b1b",
                            borderRadius: 4,
                            padding: "2px 6px",
                            fontSize: 11,
                            fontWeight: 500,
                          }}
                        >
                          ⚠ {e.failed}
                        </span>
                      )}
                      {e.dead > 0 && (
                        <span
                          style={{
                            background: "#f3f4f6",
                            color: "#374151",
                            borderRadius: 4,
                            padding: "2px 6px",
                            fontSize: 11,
                            fontWeight: 500,
                          }}
                        >
                          ✕ {e.dead}
                        </span>
                      )}
                      {e.total_attempts === 0 && (
                        <span
                          style={{
                            color: "var(--muted-foreground)",
                            fontSize: 11,
                          }}
                        >
                          No subscriptions
                        </span>
                      )}
                    </div>
                  </td>
                  <td
                    style={{
                      ...thTd,
                      fontSize: 12,
                      color: "var(--muted-foreground)",
                      whiteSpace: "nowrap",
                    }}
                  >
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
