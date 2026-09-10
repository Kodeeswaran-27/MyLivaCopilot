/**
 * main.jsx
 * Replace your existing src/main.jsx with this.
 * Wraps the app with MsalProvider (required by @azure/msal-react).
 * Everything else stays the same.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./authConfig";
import App from "./App";
import "./index.css";

// Create the MSAL instance once at app start
const msalInstance = new PublicClientApplication(msalConfig);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  </React.StrictMode>
);
