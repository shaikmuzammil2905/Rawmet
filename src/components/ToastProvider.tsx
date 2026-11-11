"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-20 right-4 z-[90] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] sm:bottom-5 pointer-events-none no-print"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-xl backdrop-blur-md transition-all ${
              t.type === "success"
                ? "border-emerald-200 bg-emerald-50/95 text-emerald-950"
                : t.type === "error"
                  ? "border-red-200 bg-red-50/95 text-red-950"
                  : "border-blue-200 bg-white/95 text-slate-900"
            }`}
          >
            {t.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
            ) : t.type === "error" ? (
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
            ) : (
              <Info className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
            )}
            <p className="text-sm font-medium leading-snug flex-1">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="text-slate-400 hover:text-slate-700 p-0.5"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

