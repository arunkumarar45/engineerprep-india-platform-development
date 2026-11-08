"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Inbox,
  Loader2,
  Search,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* =============================== Button =============================== */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "dark";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  block?: boolean;
};

const buttonVariants: Record<string, string> = {
  primary:
    "bg-brand-500 text-white border-transparent hover:bg-brand-600 active:bg-brand-700 shadow-[0_1px_2px_rgba(23,33,43,0.08)]",
  secondary:
    "bg-brand-50 text-brand-600 border-brand-100 hover:bg-brand-100",
  outline:
    "bg-white text-ink-900 border-line hover:border-brand-300 hover:text-brand-600",
  ghost: "bg-transparent text-ink-700 border-transparent hover:bg-navy-900/5",
  danger: "bg-error-500 text-white border-transparent hover:brightness-95",
  dark: "bg-navy-900 text-white border-transparent hover:bg-navy-800",
};

const buttonSizes: Record<string, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-9.5 px-4 text-sm gap-2 rounded-lg",
  lg: "h-11 px-5 text-sm gap-2 rounded-xl",
  icon: "h-9 w-9 rounded-lg justify-center",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  block = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center border font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-55",
        buttonVariants[variant],
        buttonSizes[size],
        block && "w-full",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

/* =============================== Card =============================== */

export function Card({
  className,
  children,
  hover = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn(
        "epi-card",
        hover && "epi-card-hover",
        "overflow-hidden",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-500">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-[0.95rem] font-bold text-ink-900">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* =============================== Badge =============================== */

type BadgeTone =
  | "brand"
  | "neutral"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "dark";

const badgeTones: Record<BadgeTone, string> = {
  brand: "bg-brand-50 text-brand-600 border-brand-100",
  neutral: "bg-navy-900/5 text-ink-700 border-transparent",
  success: "bg-success-500/10 text-success-500 border-success-500/20",
  warning: "bg-warning-500/12 text-[#a56a00] border-warning-500/25",
  error: "bg-error-500/10 text-error-500 border-error-500/20",
  info: "bg-[#eef4ff] text-[#2b6cb0] border-[#d6e4ff]",
  dark: "bg-navy-900 text-white border-transparent",
};

export function Badge({
  tone = "neutral",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span className={cn("epi-badge", badgeTones[tone], className)} {...props}>
      {children}
    </span>
  );
}

export { difficultyTone } from "@/lib/utils";
export type { BadgeTone } from "@/lib/utils";

/* =============================== Inputs =============================== */

type FieldWrapperProps = {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
  htmlFor?: string;
};

export function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
  htmlFor,
}: FieldWrapperProps) {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="epi-label" htmlFor={htmlFor}>
          {label}
          {required && <span className="text-error-500"> *</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="mt-1 text-[0.7rem] text-ink-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1 flex items-center gap-1 text-[0.7rem] font-medium text-error-500">
          <AlertTriangle className="size-3" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = ({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn("epi-input", className)} {...props} />
);

export const Textarea = ({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={cn("epi-input min-h-24", className)} {...props} />
);

export const Select = ({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    className={cn(
      "epi-input appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23697586%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat pr-8",
      className,
    )}
    {...props}
  >
    {children}
  </select>
);

export function Checkbox({
  label,
  className,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label
      htmlFor={inputId}
      className="flex cursor-pointer items-center gap-2 text-sm text-ink-700"
    >
      <input
        id={inputId}
        type="checkbox"
        className={cn(
          "size-4 shrink-0 rounded border-line text-brand-500 accent-brand-500",
          className,
        )}
        {...props}
      />
      {label && <span>{label}</span>}
    </label>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink-900">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-ink-500">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={typeof label === "string" ? label : "toggle"}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
          checked
            ? "border-brand-500 bg-brand-500"
            : "border-line bg-navy-900/10",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4.5 rounded-full bg-white shadow transition-all",
            checked ? "left-[1.4rem]" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}

/* ============================ Progress bar =========================== */

export function ProgressBar({
  value,
  total,
  showLabel = true,
  size = "md",
  tone = "brand",
  className,
}: {
  value: number;
  total?: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  tone?: "brand" | "success" | "warning";
  className?: string;
}) {
  const percent = total ? Math.round((value / total) * 100) : Math.round(value);
  const clamped = Math.min(100, Math.max(0, percent));
  const toneClass =
    tone === "success"
      ? "bg-success-500"
      : tone === "warning"
        ? "bg-warning-500"
        : "bg-brand-500";
  const height =
    size === "sm" ? "h-1.5" : size === "lg" ? "h-2.5" : "h-2";
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between gap-3">
        <div
          className={cn(
            "w-full overflow-hidden rounded-full bg-navy-900/8",
            height,
          )}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn("h-full rounded-full transition-all", toneClass)}
            style={{ width: `${clamped}%` }}
          />
        </div>
        {showLabel && (
          <span className="shrink-0 text-xs font-bold tabular-nums text-ink-700">
            {clamped}%
          </span>
        )}
      </div>
    </div>
  );
}

/* =============================== Tabs =============================== */

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: Array<{ id: T; label: ReactNode; count?: number }>;
  active: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "epi-scroll-x flex gap-1 border-b border-line",
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative -mb-px shrink-0 border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors",
              isActive
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-ink-500 hover:text-ink-900",
            )}
          >
            {tab.label}
            {typeof tab.count === "number" && (
              <span
                className={cn(
                  "ml-1.5 rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold",
                  isActive
                    ? "bg-brand-50 text-brand-600"
                    : "bg-navy-900/5 text-ink-500",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Array<{ id: T; label: ReactNode }>;
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-line bg-white p-0.5",
        className,
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
            value === opt.id
              ? "bg-brand-500 text-white"
              : "text-ink-500 hover:text-ink-900",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* =============================== Modal =============================== */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  const width =
    size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-lg";
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-navy-900/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "animate-fade-up relative w-full rounded-2xl border border-line bg-white shadow-lift",
          width,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-ink-900">{title}</h3>
            {description && (
              <p className="mt-1 text-xs text-ink-500">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="grid size-8 place-items-center rounded-lg text-ink-500 hover:bg-navy-900/5 hover:text-ink-900"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4 scroll-thin">
          {children}
        </div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = true,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-700">{message}</p>
    </Modal>
  );
}

/* ============================== Empty state =========================== */

export function EmptyState({
  icon,
  title,
  message,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  message?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-dashed border-line bg-white px-6 py-12 text-center",
        className,
      )}
    >
      <span className="grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-500">
        {icon ?? <Inbox className="size-6" />}
      </span>
      <h3 className="mt-3 text-sm font-bold text-ink-900">{title}</h3>
      {message && (
        <p className="mt-1 max-w-sm text-xs text-ink-500">{message}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ============================== Skeleton ============================= */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-navy-900/8",
        className,
      )}
      aria-hidden
    />
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="epi-card p-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="mt-3 h-4 w-2/3" />
          <Skeleton className="mt-2 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-4/5" />
          <Skeleton className="mt-4 h-8 w-28" />
        </div>
      ))}
    </>
  );
}

/* ============================== Toasts =============================== */

type Toast = {
  id: string;
  title: string;
  description?: string;
  tone: "success" | "error" | "info" | "warning";
};

const ToastContext = createContext<{
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  const push = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { ...toast, id }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );
  const value = useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);
  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

const toastTones: Record<Toast["tone"], string> = {
  success: "border-success-500/30 bg-success-500/10 text-success-500",
  error: "border-error-500/30 bg-error-500/10 text-error-500",
  info: "border-brand-200 bg-brand-50 text-brand-600",
  warning: "border-warning-500/30 bg-warning-500/12 text-[#a56a00]",
};

export function ToastViewport() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-200 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            "animate-fade-up pointer-events-auto flex items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-lift",
          )}
        >
          <span
            className={cn(
              "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border",
              toastTones[toast.tone],
            )}
          >
            <Check className="size-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink-900">{toast.title}</p>
            {toast.description && (
              <p className="mt-0.5 text-xs text-ink-500">{toast.description}</p>
            )}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss notification"
            className="text-ink-500 hover:text-ink-900"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ============================= Search bar ============================ */

export function SearchBar({
  value,
  onChange,
  placeholder = "Search…",
  onSubmit,
  className,
  name = "q",
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  className?: string;
  name?: string;
}) {
  return (
    <form
      role="search"
      className={cn("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500"
        aria-hidden
      />
      <input
        name={name}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="epi-input pl-9"
      />
    </form>
  );
}

/* =========================== Filter dropdown ======================== */

export function FilterDropdown({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: Array<{ id: string; label: string }>;
  className?: string;
}) {
  return (
    <Select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn("h-9 min-w-32 py-0 text-xs", className)}
    >
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.label}
        </option>
      ))}
    </Select>
  );
}

/* ============================= Pagination =========================== */

export function Pagination({
  page,
  pages,
  total,
  onChange,
}: {
  page: number;
  pages: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const numbers = useMemo(() => {
    const out: number[] = [];
    const start = Math.max(1, Math.min(page - 2, pages - 4));
    for (let i = start; i < Math.min(pages + 1, start + 5); i += 1) out.push(i);
    return out;
  }, [page, pages]);

  if (pages <= 1) {
    return (
      <p className="text-xs text-ink-500">
        Showing <span className="font-bold text-ink-900">{total}</span> results
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-ink-500">
        Page <span className="font-bold text-ink-900">{page}</span> of{" "}
        <span className="font-bold text-ink-900">{pages}</span> · {total} results
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        {numbers.map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={cn(
              "size-9 rounded-lg border text-xs font-bold transition-colors",
              n === page
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-line bg-white text-ink-700 hover:border-brand-300 hover:text-brand-600",
            )}
          >
            {n}
          </button>
        ))}
        <Button
          variant="outline"
          size="icon"
          aria-label="Next page"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

/* ============================== FileUpload ========================== */

export function FileUpload({
  accept = ".pdf,.csv,.xlsx,.json,.png,.jpg,.jpeg,.docx",
  maxSizeMb = 50,
  onFile,
  className,
}: {
  accept?: string;
  maxSizeMb?: number;
  onFile?: (file: File | null) => void;
  className?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptFile = (candidate?: File | null) => {
    if (!candidate) return;
    if (candidate.size > maxSizeMb * 1024 * 1024) {
      alert(`File exceeds the ${maxSizeMb} MB limit.`);
      return;
    }
    setFile(candidate);
    onFile?.(candidate);
  };

  return (
    <div className={className}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          acceptFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging
            ? "border-brand-400 bg-brand-50"
            : "border-line bg-white hover:border-brand-300 hover:bg-brand-50/40",
        )}
      >
        <span className="grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-500">
          <Upload className="size-6" />
        </span>
        <p className="mt-3 text-sm font-bold text-ink-900">
          Drag and drop your file here or click to upload
        </p>
        <p className="mt-1 text-xs text-ink-500">
          Supported formats: CSV, XLSX, JSON, PDF, PNG, JPG, DOCX · Max size:{" "}
          {maxSizeMb} MB
        </p>
        {file && (
          <p className="mt-3 rounded-full bg-success-500/10 px-3 py-1 text-xs font-semibold text-success-500">
            Selected: {file.name}
          </p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => acceptFile(e.target.files?.[0])}
      />
    </div>
  );
}

/* ============================== Code block ========================== */

export function CodeBlock({
  code,
  language,
}: {
  code: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="relative">
      <button
        onClick={copy}
        className="absolute right-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/10 px-2 py-1 text-[0.7rem] font-semibold text-white/90 backdrop-blur hover:bg-white/20"
      >
        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
        {copied ? "Copied" : "Copy"}
      </button>
      {language && (
        <span className="absolute left-3 top-3 text-[0.65rem] font-bold uppercase tracking-wider text-white/40">
          {language}
        </span>
      )}
      <pre className="code-block pt-9">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ================================ Table ============================= */

export function Table({
  head,
  children,
  className,
}: {
  head: ReactNode[];
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="epi-scroll-x">
      <table className={cn("w-full min-w-[38rem] text-sm", className)}>
        <thead>
          <tr className="border-b border-line text-left">
            {head.map((h, i) => (
              <th
                key={i}
                className="px-4 py-2.5 text-[0.7rem] font-bold uppercase tracking-wider text-ink-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Td({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td className={cn("border-b border-line px-4 py-3", className)}>
      {children}
    </td>
  );
}
