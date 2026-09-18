import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Keyboard, X, Command } from 'lucide-react';
import { hapticButtonClick } from '../utils/haptics';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'Tasks' | 'Navigation' | 'Views & Timers';
}

const SHORTCUTS: ShortcutItem[] = [
  { keys: ['N', 'or', '/'], description: 'Quickly focus and create new task', category: 'Tasks' },
  { keys: ['S'], description: 'Focus search filter', category: 'Tasks' },
  { keys: ['1'], description: 'Show all tasks', category: 'Navigation' },
  { keys: ['2'], description: 'Show pending tasks only', category: 'Navigation' },
  { keys: ['3'], description: 'Show completed tasks only', category: 'Navigation' },
  { keys: ['P'], description: 'Toggle Pomodoro 25m focus timer', category: 'Views & Timers' },
  { keys: ['C'], description: 'Toggle Calendar / List view', category: 'Views & Timers' },
  { keys: ['T'], description: 'Cycle theme (Light, Dark, Custom Blue)', category: 'Views & Timers' },
  { keys: ['?'], description: 'Open Keyboard Shortcuts cheat sheet', category: 'Navigation' },
  { keys: ['Esc'], description: 'Close active modal / dialog', category: 'Navigation' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
                <Keyboard className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Keyboard Shortcuts
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Fast enterprise navigation & task management
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                hapticButtonClick();
                onClose();
              }}
              className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
              aria-label="Close shortcuts dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Shortcuts List */}
          <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {['Tasks', 'Views & Timers', 'Navigation'].map((category) => (
              <div key={category} className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {category}
                </span>
                <div className="rounded-xl border border-zinc-150/80 bg-zinc-50/50 p-2 dark:border-zinc-800/80 dark:bg-zinc-850/40 space-y-1">
                  {SHORTCUTS.filter((s) => s.category === category).map((shortcut, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 text-xs"
                    >
                      <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {shortcut.keys.map((k, kIdx) =>
                          k === 'or' ? (
                            <span key={kIdx} className="text-[10px] text-zinc-400 px-0.5">
                              or
                            </span>
                          ) : (
                            <kbd
                              key={kIdx}
                              className="inline-flex min-w-5 items-center justify-center rounded-md border border-zinc-300 bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-zinc-800 shadow-2xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                            >
                              {k}
                            </kbd>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
            <div className="flex items-center gap-1">
              <Command className="h-3.5 w-3.5" />
              <span>Press <kbd className="font-bold">?</kbd> anytime to view shortcuts</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold text-xs cursor-pointer hover:opacity-90"
            >
              Got it
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
