import React, { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  Zap,
  AlertTriangle,
  RefreshCw,
  X
} from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'quota';
  title: string;
  message: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const duration = toast.duration || 4000;

  const triggerExit = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismissRef.current(toast.id);
    }, 320);
  };

  useEffect(() => {
    const enterFrame = requestAnimationFrame(() => {
      setIsVisible(true);
    });

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onDismissRef.current(toast.id);
      }, 320);
    }, duration);

    return () => {
      cancelAnimationFrame(enterFrame);
      clearTimeout(timer);
    };
  }, [toast.id, duration]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
        );
      case 'quota':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 shadow-xs">
            <Zap className="w-4 h-4 fill-current" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-8 h-8 rounded-xl bg-orange-500/15 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0 shadow-xs">
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 shadow-xs">
            <RefreshCw className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div
      role="alert"
      style={{
        transition: 'all 320ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      className={`pointer-events-auto relative group overflow-hidden rounded-2xl bg-white/95 dark:bg-[#151622]/95 backdrop-blur-2xl border border-zinc-200/80 dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-[0_12px_36px_rgba(0,0,0,0.6)] p-3.5 flex items-start gap-3 ${
        isVisible && !isExiting
          ? 'opacity-100 translate-y-0 translate-x-0 scale-100'
          : 'opacity-0 -translate-y-2 translate-x-4 scale-95'
      }`}
    >
      {/* Subtle ambient accent glow behind toast card */}
      <div
        className={`absolute -inset-1 blur-xl opacity-20 pointer-events-none -z-10 ${
          toast.type === 'success'
            ? 'bg-emerald-500'
            : toast.type === 'quota'
            ? 'bg-amber-500'
            : toast.type === 'warning'
            ? 'bg-orange-500'
            : 'bg-indigo-500'
        }`}
      />

      {getIcon()}

      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
            {toast.title}
          </h4>
          <button
            onClick={triggerExit}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-0.5 rounded-lg transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[11.5px] text-zinc-600 dark:text-zinc-300 leading-relaxed mt-0.5">
          {toast.message}
        </p>
      </div>

      {/* Smooth auto-dismiss countdown progress indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-200/40 dark:bg-white/5 overflow-hidden">
        <div
          style={{
            width: isVisible && !isExiting ? '0%' : '100%',
            transition: `width ${duration}ms linear`,
          }}
          className={`h-full ${
            toast.type === 'success'
              ? 'bg-emerald-500/70'
              : toast.type === 'quota'
              ? 'bg-amber-500/70'
              : toast.type === 'warning'
              ? 'bg-orange-500/70'
              : 'bg-indigo-500/70'
          }`}
        />
      </div>
    </div>
  );
};

