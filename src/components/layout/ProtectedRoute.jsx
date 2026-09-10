/**
 * ProtectedRoute.jsx
 * Wraps any page that requires authentication.
 * requireRole="admin" → only admins get through; others go to /chat
 */
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../components/context/AuthContext";

export default function ProtectedRoute({ children, requireRole }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div style={styles.loadingRoot}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Checking authentication…</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (requireRole === "admin" && !isAdmin) {
    return <Navigate to="/chat" replace />;
  }

  return children;
}

const styles = {
  loadingRoot: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "#f5f5f7",
    gap: 12,
  },
  spinner: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "3px solid #e0e0e0",
    borderTopColor: "#534AB7",
    animation: "spin 0.7s linear infinite",
  },
  loadingText: {
    fontSize: 14,
    color: "#888",
    margin: 0,
  },
};
