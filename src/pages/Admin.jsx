/**
 * Admin.jsx
 * Admin console with Dashboard, Conversations, Logs, Users, Analytics.
 * Data is seeded — swap fetch() calls for your backend/JSON APIs later.
 */
import React, { useState } from "react";
import ProfileMenu from "../components/layout/ProfileMenu";

// ── Nav items ─────────────────────────────────────────────────────────────────
const NAV = [
  { key: "dashboard",     icon: "▦",  label: "Dashboard" },
  { key: "conversations", icon: "💬", label: "Conversations" },
  { key: "logs",          icon: "📋", label: "Logs" },
  { key: "users",         icon: "👥", label: "Users" },
  { key: "analytics",     icon: "📊", label: "Analytics" },
];

// ── Seed data (replace with API calls when backend is ready) ──────────────────
const CONVS = [
  { id: 1, user: "Karthik R.",  init: "KR", color: "#534AB7", title: "Leave policy questions",        status: "Active",   time: "2 min ago" },
  { id: 2, user: "Sara Rao",    init: "SR", color: "#1D9E75", title: "IT support — VPN access issue", status: "Pending",  time: "18 min ago" },
  { id: 3, user: "Mike Kumar",  init: "MK", color: "#D85A30", title: "Payroll — salary slip missing", status: "Resolved", time: "1 hr ago" },
  { id: 4, user: "Amy Lee",     init: "AL", color: "#D4537E", title: "Onboarding — laptop setup",     status: "Resolved", time: "3 hr ago" },
  { id: 5, user: "Ravi Varma",  init: "RV", color: "#0891B2", title: "Benefits overview query",       status: "Active",   time: "5 hr ago" },
];

const LOGS = [
  { id: 1, time: "09:42:11", type: "INFO",  conv: "Leave policy",     detail: "Bot responded with leave policy document" },
  { id: 2, time: "09:38:05", type: "WARN",  conv: "IT support",       detail: "Fallback triggered — intent not recognised" },
  { id: 3, time: "09:30:22", type: "ERROR", conv: "Payroll query",     detail: "Direct Line connection timeout (5000ms)" },
  { id: 4, time: "09:15:44", type: "INFO",  conv: "Onboarding",       detail: "Conversation completed — user satisfied" },
  { id: 5, time: "08:55:01", type: "INFO",  conv: "Benefits overview", detail: "Bot used FAQ knowledge base successfully" },
];

const USERS = [
  { id: 1, name: "Karthik Rajan", email: "karthik@company.com", role: "admin", convs: 12, last: "Today" },
  { id: 2, name: "Sara Rao",      email: "sara@company.com",    role: "user",  convs: 8,  last: "Today" },
  { id: 3, name: "Mike Kumar",    email: "mike@company.com",    role: "user",  convs: 5,  last: "Yesterday" },
  { id: 4, name: "Amy Lee",       email: "amy@company.com",     role: "user",  convs: 3,  last: "3 days ago" },
];

const BARS = [
  { day: "Mon", val: 42 }, { day: "Tue", val: 67 },
  { day: "Wed", val: 38 }, { day: "Thu", val: 71 },
  { day: "Fri", val: 55 }, { day: "Sat", val: 22 }, { day: "Sun", val: 15 },
];
const BAR_MAX = Math.max(...BARS.map((b) => b.val));

const STATUS_COLOR = {
  Active:   { background: "#E1F5EE", color: "#0F6E56" },
  Pending:  { background: "#FAEEDA", color: "#854F0B" },
  Resolved: { background: "#F0F0FF", color: "#534AB7" },
};
const LOG_COLOR = {
  INFO:  { background: "#E1F5EE", color: "#0F6E56" },
  WARN:  { background: "#FAEEDA", color: "#854F0B" },
  ERROR: { background: "#FFEBEB", color: "#A32D2D" },
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function Admin() {
  const [active, setActive]   = useState("dashboard");
  const [convFilter, setConvFilter] = useState("All");

  const filteredConvs = convFilter === "All"
    ? CONVS
    : CONVS.filter((c) => c.status === convFilter);

  return (
    <div style={styles.root}>

      {/* ── TOP NAV ── */}
      <header style={styles.topNav}>
        <div style={styles.navLeft}>
          <div style={styles.logoIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M8 12l2-4 2 4 2-6 2 6"
                stroke="white" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={styles.appName}>Copilot Chat</span>
        </div>
        <div style={styles.navRight}>
          <ProfileMenu />
        </div>
      </header>

      <div style={styles.body}>

        {/* ── LEFT NAV ── */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarTitle}>🛡 Admin</div>
          {NAV.map((item) => (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              style={{
                ...styles.navItem,
                background:   active === item.key ? "#F0F0FF" : "transparent",
                color:        active === item.key ? "#534AB7" : "#555",
                borderLeft:   active === item.key ? "3px solid #534AB7" : "3px solid transparent",
                fontWeight:   active === item.key ? 500 : 400,
              }}
            >
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </aside>

        {/* ── CONTENT ── */}
        <main style={styles.content}>
          <div style={styles.contentHeader}>
            <span>{NAV.find((n) => n.key === active)?.label}</span>
            <span style={styles.dateLabel}>
              {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>

          <div style={styles.contentBody}>

            {/* ── DASHBOARD ── */}
            {active === "dashboard" && (
              <>
                {/* Stat cards */}
                <div style={styles.statGrid}>
                  {[
                    { label: "Total conversations", value: "1,284", sub: "↑ 12% this week",  subColor: "#1D9E75" },
                    { label: "Active today",         value: "47",    sub: "↑ 8 from yesterday", subColor: "#1D9E75" },
                    { label: "Messages sent",        value: "8,902", sub: "↑ 5% this week",   subColor: "#1D9E75" },
                    { label: "Avg. response time",   value: "1.2s",  sub: "Stable",            subColor: "#aaa" },
                  ].map((s) => (
                    <div key={s.label} style={styles.statCard}>
                      <div style={styles.statLabel}>{s.label}</div>
                      <div style={styles.statValue}>{s.value}</div>
                      <div style={{ fontSize: 11, marginTop: 3, color: s.subColor }}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Bar chart */}
                <div style={styles.card}>
                  <div style={styles.cardTitle}>Messages per day — last 7 days</div>
                  <div style={styles.barChart}>
                    {BARS.map((b) => (
                      <div key={b.day} style={styles.barCol}>
                        <div style={{
                          ...styles.bar,
                          height: `${(b.val / BAR_MAX) * 80}px`,
                          background: b.val === BAR_MAX ? "#534AB7" : "#AFA9EC",
                        }} />
                        <span style={styles.barLabel}>{b.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent conversations */}
                <ConvTable convs={CONVS.slice(0, 4)} filter={convFilter} setFilter={setConvFilter} title="Recent conversations" filterOptions={["All", "Today", "7 days"]} />
              </>
            )}

            {/* ── CONVERSATIONS ── */}
            {active === "conversations" && (
              <ConvTable convs={filteredConvs} filter={convFilter} setFilter={setConvFilter} title="All conversations" filterOptions={["All", "Active", "Pending", "Resolved"]} />
            )}

            {/* ── LOGS ── */}
            {active === "logs" && (
              <div style={styles.card}>
                <div style={styles.cardTitle}>Agent logs</div>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thead}>
                      {["Time", "Type", "Conversation", "Detail"].map((h) => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {LOGS.map((log) => (
                      <tr key={log.id} style={styles.trow}>
                        <td style={{ ...styles.td, fontFamily: "monospace", fontSize: 12, color: "#888" }}>{log.time}</td>
                        <td style={styles.td}>
                          <span style={{ ...styles.badge, ...LOG_COLOR[log.type] }}>{log.type}</span>
                        </td>
                        <td style={{ ...styles.td, fontWeight: 500 }}>{log.conv}</td>
                        <td style={{ ...styles.td, color: "#555" }}>{log.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── USERS ── */}
            {active === "users" && (
              <div style={styles.card}>
                <div style={styles.cardTitle}>All users</div>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thead}>
                      {["Name", "Email", "Role", "Conversations", "Last active"].map((h) => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {USERS.map((u) => (
                      <tr key={u.id} style={styles.trow}>
                        <td style={{ ...styles.td, fontWeight: 500 }}>{u.name}</td>
                        <td style={{ ...styles.td, color: "#888", fontSize: 12 }}>{u.email}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.badge,
                            ...(u.role === "admin"
                              ? { background: "#EEEDFE", color: "#534AB7" }
                              : { background: "#f0f0f0", color: "#555" }),
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={styles.td}>{u.convs}</td>
                        <td style={{ ...styles.td, color: "#888" }}>{u.last}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── ANALYTICS ── */}
            {active === "analytics" && (
              <>
                <div style={styles.statGrid}>
                  {[
                    { label: "Resolved without escalation", value: "87%",   sub: "↑ 3% vs last month",  subColor: "#1D9E75" },
                    { label: "Avg messages per session",    value: "6.4",   sub: "Stable",               subColor: "#aaa" },
                    { label: "Peak hour",                   value: "10 AM", sub: "Mon–Fri",              subColor: "#534AB7" },
                    { label: "Escalation rate",             value: "13%",   sub: "↓ 2% vs last month",   subColor: "#1D9E75" },
                  ].map((s) => (
                    <div key={s.label} style={styles.statCard}>
                      <div style={styles.statLabel}>{s.label}</div>
                      <div style={styles.statValue}>{s.value}</div>
                      <div style={{ fontSize: 11, marginTop: 3, color: s.subColor }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
                <div style={styles.card}>
                  <div style={styles.cardTitle}>Top topics this month</div>
                  {[
                    { topic: "Leave & holidays",   pct: 32 },
                    { topic: "IT support",          pct: 24 },
                    { topic: "Payroll & benefits",  pct: 18 },
                    { topic: "Onboarding",          pct: 14 },
                    { topic: "Other",               pct: 12 },
                  ].map((t) => (
                    <div key={t.topic} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                        <span>{t.topic}</span>
                        <span style={{ color: "#888" }}>{t.pct}%</span>
                      </div>
                      <div style={{ height: 6, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${t.pct}%`, height: "100%", background: "#534AB7", borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

// ── Reusable conversation table ───────────────────────────────────────────────
function ConvTable({ convs, filter, setFilter, title, filterOptions }) {
  return (
    <div style={styles.card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={styles.cardTitle}>{title}</div>
        <div style={{ display: "flex", gap: 6 }}>
          {filterOptions.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "4px 11px",
                borderRadius: 7,
                fontSize: 12,
                border: `1px solid ${filter === f ? "#AFA9EC" : "#ddd"}`,
                background: filter === f ? "#EEEDFE" : "transparent",
                color: filter === f ? "#534AB7" : "#666",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      {convs.map((c) => (
        <div key={c.id} style={styles.convRow}>
          <div style={{ ...styles.convAvatar, background: c.color }}>{c.init}</div>
          <span style={styles.convName}>{c.user}</span>
          <span style={styles.convTitle}>{c.title}</span>
          <span style={{ ...styles.badge, ...STATUS_COLOR[c.status] }}>{c.status}</span>
          <span style={styles.convTime}>{c.time}</span>
        </div>
      ))}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  root:    { display: "flex", flexDirection: "column", height: "100vh", fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif" },
  topNav:  { height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", borderBottom: "1px solid #ebebeb", background: "#fff", flexShrink: 0 },
  navLeft: { display: "flex", alignItems: "center", gap: 10 },
  navRight:{ display: "flex", alignItems: "center", gap: 10 },
  logoIcon:{ width: 28, height: 28, borderRadius: 7, background: "#534AB7", display: "flex", alignItems: "center", justifyContent: "center" },
  appName: { fontSize: 15, fontWeight: 600, color: "#1a1a1a", letterSpacing: "-0.2px" },
  body:    { display: "flex", flex: 1, overflow: "hidden" },
  sidebar: { width: 190, borderRight: "1px solid #ebebeb", background: "#fafafa", display: "flex", flexDirection: "column", flexShrink: 0 },
  sidebarTitle: { padding: "14px 16px", fontSize: 14, fontWeight: 600, color: "#1a1a1a", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", gap: 8 },
  navItem: { width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", border: "none", cursor: "pointer", fontSize: 13, textAlign: "left", transition: "all 0.1s", fontFamily: "inherit" },
  content: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  contentHeader: { padding: "12px 20px", borderBottom: "1px solid #ebebeb", fontSize: 15, fontWeight: 600, color: "#1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 },
  dateLabel: { fontSize: 12, color: "#aaa", fontWeight: 400 },
  contentBody: { flex: 1, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 14 },
  statGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 },
  statCard: { background: "#fafafa", border: "1px solid #ebebeb", borderRadius: 12, padding: "14px 16px" },
  statLabel:{ fontSize: 12, color: "#888", marginBottom: 4 },
  statValue:{ fontSize: 24, fontWeight: 700, color: "#1a1a1a" },
  card:     { background: "#fff", border: "1px solid #ebebeb", borderRadius: 12, padding: "16px 18px" },
  cardTitle:{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", marginBottom: 0 },
  barChart: { display: "flex", alignItems: "flex-end", gap: 8, height: 100, marginTop: 12 },
  barCol:   { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 },
  bar:      { width: "100%", borderRadius: "4px 4px 0 0", transition: "height 0.3s" },
  barLabel: { fontSize: 10, color: "#aaa" },
  convRow:  { display: "flex", alignItems: "center", gap: 10, padding: "9px 4px", borderBottom: "1px solid #f5f5f5", fontSize: 13 },
  convAvatar: { width: 24, height: 24, borderRadius: "50%", color: "#fff", fontSize: 9, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  convName: { fontWeight: 500, minWidth: 90, fontSize: 13 },
  convTitle:{ flex: 1, color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  convTime: { flexShrink: 0, color: "#aaa", fontSize: 12 },
  badge:    { padding: "2px 9px", borderRadius: 6, fontSize: 11, fontWeight: 500, flexShrink: 0 },
  table:    { width: "100%", borderCollapse: "collapse", marginTop: 10 },
  thead:    { borderBottom: "1px solid #ebebeb" },
  th:       { padding: "8px 12px", fontSize: 12, fontWeight: 600, color: "#888", textAlign: "left" },
  trow:     { borderBottom: "1px solid #f5f5f5" },
  td:       { padding: "10px 12px", fontSize: 13, color: "#1a1a1a" },
};
