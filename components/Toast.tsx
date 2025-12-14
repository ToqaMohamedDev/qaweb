"use client";

import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { createPortal } from "react-dom";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const toastConfig = {
  success: {
    icon: CheckCircle2,
    bgColor: "bg-green-500",
    textColor: "text-green-700 dark:text-green-300",
    borderColor: "border-green-300 dark:border-green-700",
  },
  error: {
    icon: AlertCircle,
    bgColor: "bg-red-500",
    textColor: "text-red-700 dark:text-red-300",
    borderColor: "border-red-300 dark:border-red-700",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-yellow-500",
    textColor: "text-yellow-700 dark:text-yellow-300",
    borderColor: "border-yellow-300 dark:border-yellow-700",
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-500",
    textColor: "text-blue-700 dark:text-blue-300",
    borderColor: "border-blue-300 dark:border-blue-700",
  },
};

function ToastItem({ toast, onRemove }: ToastProps) {
  const [isMounted, setIsMounted] = useState(false);
  const Icon = toastConfig[toast.type].icon;
  const config = toastConfig[toast.type];

  useEffect(() => {
    setIsMounted(true);
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  if (!isMounted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`
        relative flex items-start gap-3 p-4 rounded-xl shadow-lg
        bg-white dark:bg-[#1c1c24] border-2 ${config.borderColor}
        min-w-[300px] max-w-[400px]
      `}
      dir="rtl"
    >
      <div className={`p-2 rounded-lg ${config.bgColor}/10`}>
        <Icon className={`h-5 w-5 ${config.textColor}`} />
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${config.textColor}`}>
          {toast.message}
        </p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#252530] transition-colors"
        aria-label="إغلاق"
      >
        <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </button>
    </motion.div>
  );
}

export function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return createPortal(
    <div
      className="fixed top-20 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
      dir="rtl"
      aria-live="polite"
      aria-label="إشعارات"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={onRemove} />
          </div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}

// Toast Context and Hook

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  toasts: Toast[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration?: number) => {
      const id = Math.random().toString(36).substring(7);
      setToasts((prev) => [...prev, { id, message, type, duration }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast, toasts }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

