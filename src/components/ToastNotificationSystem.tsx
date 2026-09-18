import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AlertTriangle,
  BellRing,
  Check,
  Clock,
  X,
  Volume2,
  Calendar,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TodoItem, DueToast, DueAlertSeverity } from '../types';
import { playDueAlertSound, playCompleteTaskSound } from '../utils/sound';
import { hapticAlert, hapticTaskComplete, hapticButtonClick } from '../utils/haptics';

interface ToastNotificationSystemProps {
  todos: TodoItem[];
  onToggleComplete: (id: string) => void;
  reopenTrigger?: number;
}

const AUTO_DISMISS_MS = 12000; // 12 seconds per toast
const IMMINENT_WINDOW_MS = 60 * 60 * 1000; // 60 minutes
const SNOOZE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const ToastNotificationSystem: React.FC<ToastNotificationSystemProps> = ({
  todos,
  onToggleComplete,
  reopenTrigger,
}) => {
  const [toasts, setToasts] = useState<DueToast[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const dismissedToastIdsRef = useRef<Set<string>>(new Set());
  const alertedKeysRef = useRef<Set<string>>(new Set());
  const snoozedUntilRef = useRef<Map<string, number>>(new Map());

  // If user explicitly triggers / reopens notifications from header
  useEffect(() => {
    if (reopenTrigger && reopenTrigger > 0) {
      dismissedToastIdsRef.current.clear();
      snoozedUntilRef.current.clear();
      evaluateTasks();
    }
  }, [reopenTrigger]);

  // Format relative time for imminent/overdue tasks
  const formatTimeDifference = (diffMs: number): string => {
    const absDiffMs = Math.abs(diffMs);
    const diffMins = Math.floor(absDiffMs / (60 * 1000));
    const diffHours = Math.floor(absDiffMs / (60 * 60 * 1000));
    const diffDays = Math.floor(absDiffMs / (24 * 60 * 60 * 1000));

    if (diffMs < 0) {
      // Overdue
      if (diffMins < 1) return 'Overdue just now';
      if (diffMins < 60) return `Overdue by ${diffMins}m`;
      if (diffHours < 24) return `Overdue by ${diffHours}h`;
      return `Overdue by ${diffDays}d`;
    } else {
      // Imminent
      if (diffMins < 1) return 'Due in less than 1m';
      if (diffMins < 60) return `Due in ${diffMins}m`;
      return `Due in ${diffHours}h`;
    }
  };

  // Evaluate which tasks are imminent or overdue
  const evaluateTasks = useCallback(() => {
    const now = Date.now();
    const candidateToasts: DueToast[] = [];
    let hasNewAlert = false;

    for (const todo of todos) {
      if (todo.completed || !todo.dueDate) continue;

      // Check if snoozed
      const snoozedUntil = snoozedUntilRef.current.get(todo.id);
      if (snoozedUntil && snoozedUntil > now) continue;

      // Calculate deadline timestamp
      const timePart = todo.dueTime ? `${todo.dueTime}:00` : '23:59:59';
      const dueTimestamp = new Date(`${todo.dueDate}T${timePart}`).getTime();
      if (isNaN(dueTimestamp)) continue;

      const diffMs = dueTimestamp - now;
      let severity: DueAlertSeverity | null = null;

      if (diffMs < 0) {
        severity = 'overdue';
      } else if (diffMs <= IMMINENT_WINDOW_MS) {
        severity = 'imminent';
      }

      if (severity) {
        const toastId = `${todo.id}-${severity}`;
        const alertKey = `${todo.id}-${severity}-${todo.dueDate}-${todo.dueTime || ''}`;

        // Check if user dismissed this exact toast in current session
        if (dismissedToastIdsRef.current.has(toastId)) continue;

        const timeRemainingText = formatTimeDifference(diffMs);

        candidateToasts.push({
          id: toastId,
          todoId: todo.id,
          title: todo.title,
          category: todo.category || 'General',
          priority: todo.priority,
          severity,
          dueDate: todo.dueDate,
          dueTime: todo.dueTime,
          timeRemainingText,
          minutesDifference: Math.round(diffMs / 60000),
          createdAt: now,
        });

        // Track if this is a newly discovered alert key
        if (!alertedKeysRef.current.has(alertKey)) {
          alertedKeysRef.current.add(alertKey);
          hasNewAlert = true;

          // Dispatch native browser notification if allowed
          if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              try {
                const label = severity === 'overdue' ? '⚠️ Task Overdue' : '⏰ Task Due Soon';
                new Notification(`${label}: ${todo.title}`, {
                  body: `${timeRemainingText} • #${todo.category || 'General'}`,
                  icon: '/favicon.ico',
                });
              } catch {
                // Ignore restricted frame errors
              }
            }
          }
        }
      }
    }

    // Play chime sound and haptic vibration if any new alert was triggered
    if (hasNewAlert) {
      playDueAlertSound();
      hapticAlert();
    }

    setToasts(candidateToasts);
  }, [todos]);

  // Periodic polling every 5 seconds to accurately catch passing due dates
  useEffect(() => {
    evaluateTasks();
    const interval = setInterval(evaluateTasks, 5000);
    return () => clearInterval(interval);
  }, [evaluateTasks]);

  // Dismiss a specific toast
  const handleDismiss = (toastId: string) => {
    hapticButtonClick();
    dismissedToastIdsRef.current.add(toastId);
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  };

  // Dismiss all visible toasts
  const handleDismissAll = () => {
    hapticButtonClick();
    toasts.forEach((t) => dismissedToastIdsRef.current.add(t.id));
    setToasts([]);
  };

  // Complete a task from toast
  const handleComplete = (todoId: string, toastId: string) => {
    playCompleteTaskSound();
    hapticTaskComplete();
    dismissedToastIdsRef.current.add(toastId);
    onToggleComplete(todoId);
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  };

  // Snooze a task for 15 minutes
  const handleSnooze = (todoId: string, toastId: string) => {
    hapticButtonClick();
    snoozedUntilRef.current.set(todoId, Date.now() + SNOOZE_DURATION_MS);
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  };

  // Render max 3 toasts to avoid screen clutter
  const visibleToasts = toasts.slice(0, 3);
  const hiddenCount = Math.max(0, toasts.length - 3);

  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-notification-container"
      className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 max-w-sm sm:max-w-md w-[calc(100%-2.5rem)] pointer-events-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="popLayout">
        {visibleToasts.map((toast) => {
          const isOverdue = toast.severity === 'overdue';

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 30, scale: 0.94, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, y: 20, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className="pointer-events-auto w-full group relative overflow-hidden rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-4 shadow-xl border transition-all duration-200"
              style={{
                borderColor: isOverdue
                  ? 'rgba(239, 68, 68, 0.45)'
                  : 'rgba(245, 158, 11, 0.45)',
                boxShadow: isOverdue
                  ? '0 10px 25px -5px rgba(239, 68, 68, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
                  : '0 10px 25px -5px rgba(245, 158, 11, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              }}
            >
              {/* Top Row: Severity Badge + Due Relative Time + Close */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase border ${
                      isOverdue
                        ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/80 dark:text-red-300 dark:border-red-800'
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800'
                    }`}
                  >
                    {isOverdue ? (
                      <>
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600" />
                        </span>
                        <span>Overdue</span>
                      </>
                    ) : (
                      <>
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                        </span>
                        <span>Imminent</span>
                      </>
                    )}
                  </span>

                  <span
                    className={`text-xs font-semibold ${
                      isOverdue
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {toast.timeRemainingText}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDismiss(toast.id)}
                  aria-label="Dismiss toast"
                  title="Dismiss notification"
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Main Content Area */}
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    isOverdue
                      ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400'
                      : 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                  }`}
                >
                  {isOverdue ? (
                    <AlertTriangle className="h-4 w-4 stroke-[2.2]" />
                  ) : (
                    <BellRing className="h-4 w-4 animate-bounce stroke-[2.2]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate leading-snug">
                    {toast.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span className="font-medium">#{toast.category}</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {toast.dueDate} {toast.dueTime && `@ ${toast.dueTime}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleSnooze(toast.todoId, toast.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Snooze reminder for 15 minutes"
                >
                  <Clock className="h-3 w-3" />
                  <span>Snooze (15m)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleComplete(toast.todoId, toast.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-90 cursor-pointer ${
                    isOverdue
                      ? 'bg-red-600 dark:bg-red-500'
                      : 'bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900'
                  }`}
                >
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Mark Done</span>
                </button>
              </div>

              {/* Auto-dismiss subtle progress line */}
              <motion.div
                className={`absolute bottom-0 left-0 h-[2px] ${
                  isOverdue ? 'bg-red-500' : 'bg-amber-500'
                }`}
                initial={{ width: '100%' }}
                animate={{ width: isPaused ? '100%' : '0%' }}
                transition={{
                  duration: isPaused ? 0 : AUTO_DISMISS_MS / 1000,
                  ease: 'linear',
                }}
                onAnimationComplete={() => {
                  if (!isPaused) handleDismiss(toast.id);
                }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Footer Pill if multiple toasts exist */}
      {toasts.length > 1 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="pointer-events-auto flex items-center justify-between gap-3 px-3 py-1.5 rounded-xl bg-zinc-900/90 dark:bg-zinc-100/90 text-white dark:text-zinc-900 text-xs font-medium shadow-lg backdrop-blur-sm"
        >
          <span>
            {toasts.length} tasks need attention {hiddenCount > 0 && `(+${hiddenCount} more)`}
          </span>
          <button
            type="button"
            onClick={handleDismissAll}
            className="text-[11px] underline font-semibold hover:opacity-80 transition-opacity cursor-pointer ml-2"
          >
            Dismiss All
          </button>
        </motion.div>
      )}
    </div>
  );
};
