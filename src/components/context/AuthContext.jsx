/**
 * AuthContext.jsx
 * Browser-based Microsoft Entra ID SSO via @azure/msal-browser
 * Works in Vite + React (no Electron, no Node-only APIs)
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { loginRequest } from "../../authConfig";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { instance, accounts, inProgress } = useMsal();

  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);

  // ── Build user object from MSAL account ────────────────────────────────────
  const buildUser = useCallback((account) => {
    if (!account) return null;

    // Roles come from idTokenClaims if App Roles are configured in Azure
    const roles   = account.idTokenClaims?.roles || [];
    const name    = account.name || account.username || "User";
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return {
      name,
      email:    account.username,
      role:     roles.includes("Admin") ? "admin" : "user",
      initials,
      account,
    };
  }, []);

  // ── Sync MSAL accounts → user state ────────────────────────────────────────
  useEffect(() => {
    if (inProgress === InteractionStatus.None) {
      if (accounts.length > 0) {
        setUser(buildUser(accounts[0]));
      } else {
        setUser(null);
      }
      setLoading(false);
    }
  }, [accounts, inProgress, buildUser]);

  // ── Login — opens MS popup (no redirect, no page reload) ──────────────────
  const login = useCallback(async () => {
    try {
      const result = await instance.loginPopup(loginRequest);
      setUser(buildUser(result.account));
    } catch (err) {
      // User closed the popup — not a real error
      if (err.errorCode !== "user_cancelled") {
        console.error("Login error:", err);
        throw err;
      }
    }
  }, [instance, buildUser]);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await instance.logoutPopup({
        postLogoutRedirectUri: window.location.origin,
      });
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
      setUser(null);
    }
  }, [instance]);

  // ── Get a fresh access token silently (for API calls later) ───────────────
  const getAccessToken = useCallback(async () => {
    if (!accounts[0]) return null;
    try {
      const result = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });
      return result.accessToken;
    } catch {
      // Silent failed → fall back to popup
      try {
        const result = await instance.acquireTokenPopup(loginRequest);
        return result.accessToken;
      } catch (err) {
        console.error("Token acquisition failed:", err);
        return null;
      }
    }
  }, [instance, accounts]);

  const isAuthenticated = !!user;
  const isAdmin         = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isAdmin,
        login,
        logout,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
