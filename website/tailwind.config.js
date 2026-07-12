/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Segoe UI Variable", "Segoe UI", "Inter", "system-ui", "sans-serif"]
      },
      colors: {
        surface: "rgb(var(--surface) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)"
      },
      boxShadow: {
        win: "0 16px 50px rgb(0 0 0 / 0.18)",
        widget: "0 10px 32px rgb(0 0 0 / var(--shadow-strength))"
      }
    }
  },
  plugins: []
};
