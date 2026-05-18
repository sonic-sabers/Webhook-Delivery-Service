import React, { useEffect, useState, useCallback } from "react";
import { api, Subscription } from "../api";

const thTd: React.CSSProperties = { padding: "12px 16px", textAlign: "left" };

export default function Subscriptions() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [types, setTypes] = useState("*");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setRefreshing(true);
    api
      .getSubscriptions()
      .then((data) => {
        setSubs(data);
        setLastUpdated(new Date());
        setError("");
      })
      .catch((e) => setError(String(e)))
      .finally(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.createSubscription({
        url,
        secret: secret || undefined,
        event_types: types
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setUrl("");
      setSecret("");
      setTypes("*");
      load();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api.deleteSubscription(id);
      load();
    } catch (err) {
      setError(String(err));
      load();
    }
  };

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
            Subscriptions
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
            Manage webhook endpoints and event type filters.
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

      {/* Create card */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: 24,
          marginBottom: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <h2
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--foreground)",
            marginBottom: 16,
          }}
        >
          New Subscription
        </h2>

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              borderRadius: "var(--radius)",
              padding: "8px 12px",
              marginBottom: 16,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={create}
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <div style={{ flex: "2 1 240px" }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--foreground)",
                marginBottom: 6,
              }}
            >
              Endpoint URL
            </label>
            <input
              placeholder="https://your-server.com/webhook"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          <div style={{ flex: "1 1 150px" }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--foreground)",
                marginBottom: 6,
              }}
            >
              Secret{" "}
              <span
                style={{ color: "var(--muted-foreground)", fontWeight: 400 }}
              >
                (optional)
              </span>
            </label>
            <input
              placeholder="signing secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
          </div>
          <div style={{ flex: "1 1 150px" }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--foreground)",
                marginBottom: 6,
              }}
            >
              Event Types
            </label>
            <input
              placeholder="order.*, user.created"
              value={types}
              onChange={(e) => setTypes(e.target.value)}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: "var(--primary)",
                color: "var(--primary-foreground)",
                height: 36,
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      {subs.length === 0 ? (
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
          No subscriptions yet. Create one above.
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
                {["ID", "URL", "Event Types", "Created", "Action"].map(
                  (h, idx) => (
                    <th
                      key={h}
                      style={{
                        ...thTd,
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--muted-foreground)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        textAlign: idx === 4 ? "right" : "left",
                        paddingRight: idx === 4 ? 24 : 16,
                      }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {subs.map((s, i) => (
                <tr
                  key={s.id}
                  style={{
                    borderBottom:
                      i < subs.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <td
                    style={{
                      ...thTd,
                      fontFamily: "monospace",
                      fontSize: 12,
                      color: "var(--muted-foreground)",
                    }}
                  >
                    {s.id.slice(0, 8)}…
                  </td>
                  <td
                    style={{
                      ...thTd,
                      fontSize: 13,
                      maxWidth: 280,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.url}
                  </td>
                  <td style={{ ...thTd }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {JSON.parse(s.event_types).map((t: string) => (
                        <span
                          key={t}
                          style={{
                            background: "var(--secondary)",
                            color: "var(--secondary-foreground)",
                            borderRadius: 4,
                            padding: "2px 8px",
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        >
                          {t}
                        </span>
                      ))}
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
                    {new Date(s.created_at).toLocaleString()}
                  </td>
                  <td style={{ ...thTd, textAlign: "right", paddingRight: 24 }}>
                    <button
                      onClick={() => remove(s.id)}
                      style={{
                        background: "transparent",
                        color: "var(--destructive)",
                        border: "1px solid #fecaca",
                        fontSize: 12,
                        padding: "6px 12px",
                        borderRadius: "var(--radius)",
                        cursor: "pointer",
                      }}
                    >
                      Disable
                    </button>
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
