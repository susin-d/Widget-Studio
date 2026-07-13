import { create } from "zustand";

export interface UserSession {
  token: string | null;
  email: string | null;
}

export type SessionSource = "login" | "signup" | "oauth";

interface AuthStore {
  token: string | null;
  email: string | null;
  loading: boolean;
  error: string | null;
  syncStatus: "synced" | "syncing" | "error" | "offline";
  lastSyncedAt: string | null;
  sessionVersion: number;
  sessionSource: SessionSource | null;
  
  initialize: () => void;
  setSession: (token: string, email: string, source?: SessionSource) => void;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  setSyncStatus: (status: "synced" | "syncing" | "error" | "offline") => void;
  setLastSyncedAt: (time: string | null) => void;
}

const configuredBackendUrl = import.meta.env.VITE_BACKEND_URL?.trim();

// Separate Vercel deployments use VITE_BACKEND_URL for the standalone API.
// Keep local Vite development pointed at the Uvicorn server when no override exists.
export const BACKEND_URL = configuredBackendUrl ?? (import.meta.env.DEV ? "http://localhost:8000" : "");

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: null,
  email: null,
  loading: false,
  error: null,
  syncStatus: "offline",
  lastSyncedAt: null,
  sessionVersion: 0,
  sessionSource: null,

  initialize: () => {
    const savedToken = localStorage.getItem("widget-studio-token");
    const savedEmail = localStorage.getItem("widget-studio-email");
    if (savedToken && savedEmail) {
      set({ token: savedToken, email: savedEmail, syncStatus: "synced" });
    }
  },

  setSession: (token, email, source = "oauth") => {
    localStorage.setItem("widget-studio-token", token);
    localStorage.setItem("widget-studio-email", email);
    set((state) => ({
      token,
      email,
      error: null,
      syncStatus: "synced",
      sessionVersion: state.sessionVersion + 1,
      sessionSource: source
    }));
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Authentication failed");
      }
      get().setSession(data.access_token, data.email, "login");
    } catch (err: any) {
      set({ error: err.message || "Something went wrong" });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  signup: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Signup failed");
      }
      get().setSession(data.access_token, data.email, "signup");
    } catch (err: any) {
      set({ error: err.message || "Something went wrong" });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    localStorage.removeItem("widget-studio-token");
    localStorage.removeItem("widget-studio-email");
    set({ token: null, email: null, error: null, syncStatus: "offline", lastSyncedAt: null, sessionSource: null });
  },

  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
}));
