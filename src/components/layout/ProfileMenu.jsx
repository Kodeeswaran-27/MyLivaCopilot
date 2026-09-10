/**
 * ProfileMenu.jsx
 * Drop this into your existing TopBar.jsx.
 * Shows the user's initials, a MS-style dropdown with:
 *   - profile info
 *   - switch view (User chat / Admin console)
 *   - sign out
 */
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../components/context/AuthContext";

export default function ProfileMenu() {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen]           = useState(false);
  const menuRef                   = useRef(null);
  const navigate                  = useNavigate();
  const location                  = useLocation();

  const isOnAdmin = location.pathname.startsWith("/admin");
  const isOnChat  = location.pathname.startsWith("/chat");

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSwitch = (path) => {
    navigate(path);
    setOpen(false);
  };

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  if (!user) return null;

  return (
    <div ref={menuRef} style={styles.wrapper}>

      {/* Avatar button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          ...styles.avatarBtn,
          outline: open ? "2.5px solid #AFA9EC" : "2.5px solid transparent",
        }}
        title={user.name}
        aria-label="Open profile menu"
      >
        {user.initials}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={styles.dropdown}>

          {/* Profile header */}
          <div style={styles.profileRow}>
            <div style={styles.dpAvatar}>{user.initials}</div>
            <div style={styles.profileInfo}>
              <div style={styles.dpName}>{user.name}</div>
              <div style={styles.dpEmail}>{user.email}</div>
              <div style={styles.dpRole}>
                {isAdmin ? "🛡 Administrator" : "👤 Employee"}
              </div>
            </div>
          </div>

          <div style={styles.divider} />

          {/* Switch view */}
          <div style={styles.section}>
            <div style={styles.sectionLabel}>Switch view</div>

            <MenuButton
              icon="💬"
              label="User chat"
              active={isOnChat}
              onClick={() => handleSwitch("/chat")}
            />

            {/* Admin option only shown to admins */}
            {isAdmin && (
              <MenuButton
                icon="🛡"
                label="Admin console"
                active={isOnAdmin}
                onClick={() => handleSwitch("/admin")}
              />
            )}
          </div>

          <div style={styles.divider} />

          {/* Account */}
          <div style={styles.section}>
            <div style={styles.sectionLabel}>Account</div>
            <MenuButton icon="👤" label="My profile" onClick={() => setOpen(false)} />
            <MenuButton icon="⚙️" label="Settings"   onClick={() => setOpen(false)} />
          </div>

          <div style={styles.divider} />

          {/* Sign out */}
          <div style={{ padding: "6px 8px 8px" }}>
            <button onClick={handleLogout} style={styles.signOutBtn}>
              <span>↩</span> Sign out
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

// ── Small reusable menu row ───────────────────────────────────────────────────
function MenuButton({ icon, label, active, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...styles.menuBtn,
        background: active
          ? "#EEEDFE"
          : hover
          ? "#f5f5f7"
          : "transparent",
        color: active ? "#534AB7" : "#333",
      }}
    >
      <span style={{ fontSize: 15 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {active && <span style={{ color: "#534AB7", fontSize: 13 }}>✓</span>}
    </button>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  wrapper: {
    position: "relative",
  },
  avatarBtn: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "#534AB7",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "outline 0.15s",
    fontFamily: "inherit",
  },
  dropdown: {
    position: "absolute",
    top: 42,
    right: 0,
    width: 268,
    background: "#fff",
    border: "1px solid #e8e8e8",
    borderRadius: 14,
    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
    zIndex: 1000,
    overflow: "hidden",
  },
  profileRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 16px 12px",
  },
  dpAvatar: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    background: "#534AB7",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  profileInfo: { flex: 1, minWidth: 0 },
  dpName:  { fontSize: 13, fontWeight: 600, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  dpEmail: { fontSize: 11, color: "#888", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  dpRole:  { fontSize: 11, color: "#534AB7", marginTop: 3, fontWeight: 500 },
  divider: { height: 1, background: "#f0f0f0", margin: "0 8px" },
  section: { padding: "6px 8px" },
  sectionLabel: {
    fontSize: 10,
    color: "#aaa",
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    padding: "4px 8px 2px",
  },
  menuBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 10px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    textAlign: "left",
    transition: "background 0.1s",
    fontFamily: "inherit",
  },
  signOutBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 10px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    color: "#c0392b",
    background: "transparent",
    textAlign: "left",
    fontFamily: "inherit",
  },
};
