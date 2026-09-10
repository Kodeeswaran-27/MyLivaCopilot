/**
 * authConfig.js
 * Microsoft Entra ID (MSAL Browser) configuration
 * Uses your existing clientId + tenantId from authconfig.js
 */
import { LogLevel } from "@azure/msal-browser";

export const msalConfig = {
  auth: {
    clientId:    "7eff9e1c-81d1-417b-919f-6f3b3a14d8cc",
    authority:   "https://login.microsoftonline.com/0d39ec75-ea4a-4ac7-b416-6ad044ef804c",
    redirectUri: "http://localhost:5173", // e.g. http://localhost:5173
  },
  cache: {
    cacheLocation:       "sessionStorage", // safer than localStorage
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        if (level === LogLevel.Error) console.error("[MSAL]", message);
      },
      piiLoggingEnabled: false,
      logLevel: LogLevel.Warning,
    },
  },
};

// Scopes requested at login — matches your original authconfig.js
export const loginRequest = {
  scopes: ["user.read", "openid", "profile", "email"],
};

// Add more scope sets here as needed for Direct Line / Graph API later
export const graphRequest = {
  scopes: ["User.Read"],
};
