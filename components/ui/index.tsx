// components/ui/index.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ── Button ────────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "dark" | "gold" | "destructive";
  size?: "sm" | "default" | "lg";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "default",
      loading,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const base = [
      "inline-flex items-center justify-center gap-2 font-medium transition-all",
      "rounded-pill cursor-pointer border border-transparent",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green",
      "disabled:opacity-50 disabled:pointer-events-none",
      "active:scale-[0.96]",
    ].join(" ");

    const variants = {
      primary:
        "bg-[var(--green-cta)] text-white border-[var(--green-cta)] hover:bg-[var(--green)]",
      outline: "bg-transparent text-ink border-ink hover:bg-cream",
      ghost: "bg-transparent text-ink border-none hover:bg-cream",
      dark: "bg-[var(--green-deep)] text-white border-[var(--green-deep)] hover:bg-green-uplift",
      gold: "bg-gold text-[var(--green-deep)] border-gold font-semibold hover:bg-gold-soft",
      destructive:
        "bg-[var(--stamp-red)] text-white border-[var(--stamp-red)] hover:bg-[var(--stamp-red-2)]",
    };

    const sizes = {
      sm: "h-8 px-4 text-xs tracking-wide",
      default: "h-10 px-5 text-sm",
      lg: "h-12 px-7 text-[15px] font-semibold",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

// ── Input ─────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <div className="w-full">
      <input
        ref={ref}
        className={cn(
          "w-full bg-white text-ink font-sans text-sm px-3 py-2",
          "border border-hairline rounded-input",
          "placeholder:text-ink-faint",
          "focus:outline-none focus:ring-2 focus:ring-green focus:border-transparent",
          "disabled:opacity-50",
          error && "border-stamp focus:ring-stamp",
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-stamp">{error}</p>}
    </div>
  ),
);
Input.displayName = "Input";

// ── Label ─────────────────────────────────────────────────────────────────────

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-xs font-mono tracking-widest uppercase text-ink-soft",
      className,
    )}
    {...props}
  />
));
Label.displayName = "Label";

// ── Card ──────────────────────────────────────────────────────────────────────

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("bg-white rounded-card shadow-card", className)}
    {...props}
  />
));
Card.displayName = "Card";

export const CardHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("px-6 py-4 border-b border-hairline", className)}
    {...props}
  />
);

export const CardTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn(
      "font-display font-semibold text-green-deep text-lg tracking-tight",
      className,
    )}
    {...props}
  />
);

export const CardContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("px-6 py-4", className)} {...props} />
);

// ── Badge / Pill ──────────────────────────────────────────────────────────────

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "green" | "gold" | "red" | "dark" | "outline" | "muted";
}

export const Badge = ({
  className,
  variant = "muted",
  ...props
}: BadgeProps) => {
  const variants = {
    green: "bg-green-pale text-green-deep",
    gold: "border border-gold text-gold",
    red: "bg-[rgba(156,42,31,0.08)] text-stamp",
    dark: "bg-green-deep text-white",
    outline: "border border-ink text-ink",
    muted: "bg-cream text-ink-soft border border-hairline",
    warning: "bg-gold-pale text-[var(--green-deep)] border border-gold-soft",
    success: "bg-green-pale text-green-deep",
    error: "bg-[rgba(156,42,31,0.08)] text-stamp",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill",
        "font-mono text-[10.5px] tracking-widest uppercase font-medium",
        variants[variant as keyof typeof variants] ?? variants.muted,
        className,
      )}
      {...props}
    />
  );
};

// ── Separator ─────────────────────────────────────────────────────────────────

export const Separator = ({ className }: { className?: string }) => (
  <div className={cn("hairline my-4", className)} />
);

// ── Toast / Toaster ───────────────────────────────────────────────────────────

type ToastData = { id: string; message: string; type: "success" | "error" };

const ToastContext = React.createContext<{
  toast: (message: string, type?: "success" | "error") => void;
}>({ toast: () => {} });

export function useToast() {
  return React.useContext(ToastContext);
}

/**
 * Wrap the entire layout in ToastProvider instead of rendering Toaster as sibling.
 * This makes useToast() available to all child components.
 *
 * In app/[locale]/layout.tsx:
 *   <ToastProvider>
 *     <Navbar />
 *     <main>{children}</main>
 *     <footer />
 *   </ToastProvider>
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  const toast = React.useCallback(
    (message: string, type: "success" | "error" = "success") => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        3200,
      );
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast display — fixed bottom right */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 18px",
              borderRadius: "var(--r-card)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
              fontFamily: "var(--f-sans)",
              fontSize: 14,
              fontWeight: 500,
              background:
                t.type === "success" ? "var(--green-deep)" : "var(--stamp-red)",
              color: "var(--cream)",
              animation: "slideInRight 0.2s ease",
              pointerEvents: "auto",
            }}
          >
            <span
              style={{
                fontFamily: "var(--f-display)",
                fontStyle: "italic",
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              {t.type === "success" ? "✓" : "✕"}
            </span>
            {t.message}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(16px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

// Keep Toaster as alias for backwards compatibility during migration
export const Toaster = ToastProvider;
