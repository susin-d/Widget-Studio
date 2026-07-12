import { create } from "zustand";

export type WebRoute = "landing" | "features" | "auth" | "download" | "faq" | "dashboard";

interface RouteStore {
  currentRoute: WebRoute;
  authViewMode: "login" | "signup";
  setRoute: (route: WebRoute) => void;
  setAuthViewMode: (mode: "login" | "signup") => void;
}

export const useRouteStore = create<RouteStore>((set) => {
  // Sync initial hash route if present
  const getHashRoute = (): WebRoute => {
    const hash = window.location.hash.replace("#", "") as WebRoute;
    const validRoutes: WebRoute[] = ["landing", "features", "auth", "download", "faq", "dashboard"];
    return validRoutes.includes(hash) ? hash : "landing";
  };

  // Listen to hash changes in browser
  if (typeof window !== "undefined") {
    window.addEventListener("hashchange", () => {
      const hash = getHashRoute();
      set({ currentRoute: hash });
    });
  }

  return {
    currentRoute: getHashRoute(),
    authViewMode: "login",
    setRoute: (route) => {
      if (typeof window !== "undefined") {
        window.location.hash = route;
      }
      set({ currentRoute: route });
    },
    setAuthViewMode: (authViewMode) => set({ authViewMode }),
  };
});
