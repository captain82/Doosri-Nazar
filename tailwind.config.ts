import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F6F1E8",
        "paper-deep": "#EFE8DA",
        card: "#FDFBF6",
        ink: "#221D14",
        "ink-soft": "#6E6455",
        line: "#E0D7C6",
        terra: "#B5451B",
        "terra-deep": "#8C3312",
        "terra-tint": "#F7E9E0",
        ok: "#44691F",
        "ok-tint": "#EAF0DC",
        warn: "#8F6207",
        "warn-tint": "#F7EED6",
        bad: "#A82C10",
        "bad-tint": "#F8E5DC",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        wordmark: ["var(--font-wordmark)", "Georgia", "serif"],
        serifd: ["var(--font-serifd)", "Georgia", "serif"],
        dm: ["var(--font-dm)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
