// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Paper ──────────────────────────────────────
        cream: "var(--cream)",
        ceramic: "var(--ceramic)",
        paper: "var(--paper)",

        // ── Coupon ─────────────────────────────────────
        coupon: {
          bg: "var(--coupon-bg)",
          ink: "var(--coupon-ink)",
          rule: "var(--coupon-rule)",
          soft: "var(--coupon-rule-soft)",
        },

        // ── Ink ────────────────────────────────────────
        ink: {
          DEFAULT: "var(--ink)",
          soft: "var(--ink-soft)",
          faint: "var(--ink-faint)",
        },
        hairline: "var(--hairline)",

        // ── Green ──────────────────────────────────────
        green: {
          DEFAULT: "var(--green)",
          cta: "var(--green-cta)",
          deep: "var(--green-deep)",
          uplift: "var(--green-uplift)",
          pale: "var(--green-pale)",
        },

        // ── Gold ───────────────────────────────────────
        gold: {
          DEFAULT: "var(--gold)",
          soft: "var(--gold-soft)",
          pale: "var(--gold-pale)",
        },

        // ── Stamp ──────────────────────────────────────
        stamp: {
          DEFAULT: "var(--stamp-red)",
          2: "var(--stamp-red-2)",
        },
      },

      fontFamily: {
        sans: ["var(--f-sans)"],
        display: ["var(--f-display)"],
        serif: ["var(--f-serif)"],
        mono: ["var(--f-mono)"],
        hand: ["var(--f-hand)"],
      },

      borderRadius: {
        coupon: "var(--r-coupon)",
        input: "var(--r-input)",
        card: "var(--r-card)",
        pill: "var(--r-pill)",
      },

      boxShadow: {
        card: "var(--sh-card)",
        stuck: "var(--sh-stuck)",
      },

      transitionTimingFunction: {
        tipsy: "var(--ease)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
