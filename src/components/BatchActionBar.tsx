import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckSquare,
  Square,
  CheckCircle2,
  Circle,
  Flag,
  Trash2,
  X,
  ChevronDown,
} from 'lucide-react';
import { Priority } from '../types';
import { PRIORITY_CONFIG } from '../constants';
import { hapticButtonClick, hapticDelete, hapticTaskComplete } from '../utils/haptics';

interface BatchActionBarProps {
  selectedCount: number;
  totalFilteredCount: number;
  allSelected: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBatchComplete: (completed: boolean) => void;
  onBatchUpdatePriority: (priority: Priority) => void;
  onBatchDelete: () => void;
  onExitSelectionMode: () => void;
}

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
  selectedCount,
  totalFilteredCount,
  allSelected,
  onSelectAll,
  onDeselectAll,
  onBatchComplete,
  onBatchUpdatePriority,
  onBatchDelete,
  onExitSelectionMode,
}) => {
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);

  return (
    <AnimatePresence>
      <motion.div
        id="batch-action-bar"
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
        className="sticky bottom-6 z-40 mx-auto w-full max-w-2xl px-2"
        role="toolbar"
        aria-label="Batch operations toolbar"
      >
        <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-zinc-200/90 bg-white/95 p-2.5 sm:p-3 shadow-xl backdrop-blur-md dark:border-zinc-700/80 dark:bg-zinc-900/95">
          {/* Left section: Select All Toggle and Selected Count Badge */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="batch-select-all-toggle-btn"
              onClick={() => {
                hapticButtonClick();
                if (allSelected) {
                  onDeselectAll();
                } else {
                  onSelectAll();
                }
              }}
              className="flex items-center gap-1.5 rounded-xl bg-zinc-100 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              title={allSelected ? 'Deselect all filtered tasks' : 'Select all filtered tasks'}
            >
              {allSelected ? (
                <CheckSquare className="h-4 w-4 text-sky-500" />
              ) : (
                <Square className="h-4 w-4 text-zinc-400" />
              )}
              <span>{allSelected ? 'Deselect' : 'Select All'}</span>
            </button>

            <span className="inline-flex items-center rounded-lg bg-sky-50 px-2 py-1 text-xs font-bold text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/50">
              {selectedCount} of {totalFilteredCount} selected
            </span>
          </div>

          {/* Right section: Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Mark Complete */}
            <button
              type="button"
              id="batch-mark-complete-btn"
              disabled={selectedCount === 0}
              onClick={() => {
                hapticTaskComplete();
                onBatchComplete(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300 transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              title="Mark selected tasks as completed"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Complete</span>
            </button>

            {/* Mark Pending */}
            <button
              type="button"
              id="batch-mark-pending-btn"
              disabled={selectedCount === 0}
              onClick={() => {
                hapticButtonClick();
                onBatchComplete(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-100 px-2 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              title="Mark selected tasks as pending"
            >
              <Circle className="h-3.5 w-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Pending</span>
            </button>

            {/* Update Priority Dropdown/Button */}
            <div className="relative">
              <button
                type="button"
                id="batch-priority-menu-btn"
                disabled={selectedCount === 0}
                onClick={() => {
                  hapticButtonClick();
                  setShowPriorityMenu((prev) => !prev);
                }}
                className="inline-flex items-center gap-1 rounded-xl bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                aria-expanded={showPriorityMenu}
                title="Update priority of selected tasks"
              >
                <Flag className="h-3.5 w-3.5 text-amber-500" />
                <span>Priority</span>
                <ChevronDown className="h-3 w-3 text-zinc-400" />
              </button>

              {showPriorityMenu && (
                <div
                  id="batch-priority-dropdown"
                  className="absolute right-0 bottom-full mb-2 w-36 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-zinc-700 dark:bg-zinc-800 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Set Priority:
                  </div>
                  {(['low', 'medium', 'high'] as Priority[]).map((p) => {
                    const cfg = PRIORITY_CONFIG[p];
                    return (
                      <button
                        key={p}
                        type="button"
                        id={`batch-set-priority-${p}`}
                        onClick={() => {
                          hapticButtonClick();
                          onBatchUpdatePriority(p);
                          setShowPriorityMenu(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-700/70 transition-colors cursor-pointer text-left"
                      >
                        <span className={`h-2 w-2 rounded-full ${cfg.dotColor}`} />
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Batch Delete */}
            <button
              type="button"
              id="batch-delete-btn"
              disabled={selectedCount === 0}
              onClick={() => {
                hapticDelete();
                onBatchDelete();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-900/50 transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              title="Delete all selected tasks"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
              <span>Delete{selectedCount > 0 ? ` (${selectedCount})` : ''}</span>
            </button>

            {/* Exit Selection Mode Button */}
            <button
              type="button"
              id="batch-exit-selection-btn"
              onClick={() => {
                hapticButtonClick();
                onExitSelectionMode();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              aria-label="Exit selection mode"
              title="Exit selection mode"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
