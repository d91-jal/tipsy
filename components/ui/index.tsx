// components/ui/index.tsx
// Minimal shadcn-compatible components without the CLI dependency

import * as React from "react";
import { cn } from "@/lib/utils";

// ── Button ────────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  size?: "sm" | "default" | "lg";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", loading, children, disabled, ...props }, ref) => {
    const base = "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch-500 disabled:opacity-50 disabled:pointer-events-none";
    const variants = {
      default: "bg-pitch-500 text-white hover:bg-pitch-600",
      outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-pitch-400",
      ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      destructive: "bg-red-600 text-white hover:bg-red-700",
      secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    };
    const sizes = {
      sm: "h-8 px-3 text-xs",
      default: "h-10 px-4 text-sm",
      lg: "h-11 px-6 text-base",
    };
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
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
          "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm",
          "placeholder:text-slate-400",
          "focus:outline-none focus:ring-2 focus:ring-pitch-500 focus:border-transparent",
          "disabled:opacity-50",
          error && "border-red-400 focus:ring-red-400",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";

// ── Label ─────────────────────────────────────────────────────────────────────

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("text-sm font-medium text-slate-700", className)}
    {...props}
  />
));
Label.displayName = "Label";

// ── Card ──────────────────────────────────────────────────────────────────────

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("px-5 py-4 border-b border-slate-100", className)} {...props} />
);

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("font-semibold text-slate-800", className)} {...props} />
);

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("px-5 py-4", className)} {...props} />
);

// ── Badge ─────────────────────────────────────────────────────────────────────

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "muted";
}

export const Badge = ({ className, variant = "default", ...props }: BadgeProps) => {
  const variants = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    error: "bg-red-100 text-red-700",
    muted: "bg-slate-50 text-slate-400",
  };
  return (
    <span
      className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", variants[variant], className)}
      {...props}
    />
  );
};

// ── Toaster (simple toast system) ─────────────────────────────────────────────

type ToastData = { id: string; message: string; type: "success" | "error" };

const ToastContext = React.createContext<{
  toast: (message: string, type?: "success" | "error") => void;
}>({ toast: () => {} });

export function useToast() {
  return React.useContext(ToastContext);
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  const toast = React.useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg",
              "animate-in slide-in-from-bottom-4 duration-300",
              t.type === "success" ? "bg-pitch-600 text-white" : "bg-red-600 text-white"
            )}
          >
            <span>{t.type === "success" ? "✓" : "✕"}</span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ── Separator ─────────────────────────────────────────────────────────────────

export const Separator = ({ className }: { className?: string }) => (
  <hr className={cn("border-slate-100", className)} />
);
