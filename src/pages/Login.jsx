/**
 * Login.jsx
 * Microsoft Entra ID SSO login page — popup flow (no redirect).
 * On success React Router automatically navigates via AuthContext.
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/context/AuthContext";

export default function Login() {
  const { login, isAuthenticated, isAdmin, loading } = useAuth();
  const [signing, setSigning]   = useState(false);
  const [error, setError]       = useState("");
  const navigate                = useNavigate();

  // Already authenticated → redirect immediately
  // useEffect(() => {
  //   isAuthenticated = true;
  //   if (!loading && isAuthenticated) {
  //     navigate(isAdmin ? "/admin" : "/chat", { replace: true });
  //   }
  // }, [isAuthenticated, isAdmin, loading, navigate]);

  // const handleLogin = async () => {
  //   setSigning(true);
  //   setError("");
  //   try {
  //     await login();
  //     // Navigation handled by useEffect above once user is set
  //   } catch (err) {
  //     setError(err.message || "Login failed. Please try again.");
  //     setSigning(false);
  //   }
  //   await login();
  // };

  const handleLogin = ()=>{
    navigate("/chat",{replace :true});
  };

  return (
    <div style={styles.root}>
      {/* Soft background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.card}>

        {/* Logo row */}
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M8 12l2-4 2 4 2-6 2 6"
                stroke="white" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={styles.appName}>Copilot Chat</span>
        </div>

        <h1 style={styles.heading}>Welcome back</h1>
        <p style={styles.subheading}>
          Sign in with your Microsoft account to continue
        </p>

        {/* Error banner */}
        {error && (
          <div style={styles.errorBox}>
            <span style={{ marginRight: 8, flexShrink: 0 }}>⚠</span>
            {error}
          </div>
        )}

        {/* Text box for signing in */}
        <div style={{ width: "100%", marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Enter your email"
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 10,
              border: "1.5px solid #d0d0d0",
              fontSize: 15,
              color: "#888",
              background: "#f5f5f7",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Microsoft sign-in button */}
        <button
          onClick={handleLogin}
          disabled={signing || loading}
          style={{
            ...styles.msBtn,
            opacity: signing || loading ? 0.72 : 1,
            cursor: signing || loading ? "not-allowed" : "pointer",
          }}
        >
          {signing ? (
            <>
              <div style={styles.btnSpinner} />
              Signing in…
            </>
          ) : (
            <>
              {/* Microsoft four-square logo */}
              <svg width="20" height="20" viewBox="0 0 21 21" style={{ flexShrink: 0 }}>
                <rect x="1"  y="1"  width="9" height="9" fill="#f25022" />
                <rect x="11" y="1"  width="9" height="9" fill="#7fba00" />
                <rect x="1"  y="11" width="9" height="9" fill="#00a4ef" />
                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
              </svg>
              Sign in
            </>
          )}
        </button>

        {signing && (
          <p style={styles.hint}>
            A sign-in popup will appear. Complete it and return here.
          </p>
        )}

        <p style={styles.footer}>
          Powered by Microsoft Entra ID · Copilot Studio
        </p>
      </div>

      {/* Inline keyframe for spinner */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f5f7",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  blob1: {
    position: "absolute", top: -140, right: -140,
    width: 440, height: 440, borderRadius: "50%",
    background: "radial-gradient(circle, #AFA9EC44 0%, transparent 70%)",
    pointerEvents: "none",
  },
  blob2: {
    position: "absolute", bottom: -120, left: -120,
    width: 380, height: 380, borderRadius: "50%",
    background: "radial-gradient(circle, #7F77DD2A 0%, transparent 70%)",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    zIndex: 1,
    background: "#fff",
    borderRadius: 20,
    padding: "48px 52px",
    width: 420,
    boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  logoRow: {
    display: "flex", alignItems: "center", gap: 10, marginBottom: 28,
  },
  logoIcon: {
    width: 40, height: 40, borderRadius: 10,
    background: "#534AB7",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  appName: {
    fontSize: 18, fontWeight: 600, color: "#1a1a1a", letterSpacing: "-0.3px",
  },
  heading: {
    fontSize: 24, fontWeight: 700, color: "#1a1a1a",
    margin: "0 0 8px", textAlign: "center",
  },
  subheading: {
    fontSize: 14, color: "#666", margin: "0 0 28px",
    textAlign: "center", lineHeight: 1.55,
  },
  errorBox: {
    width: "100%",
    background: "#fff1f0",
    border: "1px solid #ffa39e",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    color: "#cf1322",
    marginBottom: 16,
    display: "flex",
    alignItems: "flex-start",
  },
  msBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: "13px 20px",
    background: "#fff",
    border: "1.5px solid #d0d0d0",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 500,
    color: "#1a1a1a",
    marginBottom: 12,
    fontFamily: "inherit",
    transition: "border-color 0.15s, box-shadow 0.15s",
  },
  btnSpinner: {
    width: 18, height: 18, borderRadius: "50%",
    border: "2.5px solid #ddd",
    borderTopColor: "#534AB7",
    animation: "spin 0.7s linear infinite",
    flexShrink: 0,
  },
  hint: {
    fontSize: 12, color: "#888", textAlign: "center",
    margin: "2px 0 0", lineHeight: 1.5,
  },
  footer: {
    marginTop: 36, fontSize: 12, color: "#bbb", textAlign: "center",
  },
};
