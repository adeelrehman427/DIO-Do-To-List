import React, { useState } from 'react';
import {
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  TrendingUp,
  Tag,
  Repeat,
  Search,
} from 'lucide-react';
import { TodoItem } from '../types';
import { getCategoryConfig, getPriorityConfig } from '../constants';

interface ActivityHistoryProps {
  todos: TodoItem[];
}

export const ActivityHistory: React.FC<ActivityHistoryProps> = ({ todos }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Extract completed tasks sorted newest completion first
  const completedTasks = todos
    .filter((t) => t.completed)
    .sort((a, b) => {
      const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return timeB - timeA;
    });

  const filteredHistory = completedTasks.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by date
  const formatCompletedDate = (isoStr?: string) => {
    if (!isoStr) return 'Previously Completed';
    const date = new Date(isoStr);
    const today = new Date();
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      id="activity-history-section"
      className="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800/80"
    >
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/40">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Completed Tasks History
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.2 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/40 dark:border-emerald-900/40">
                <TrendingUp className="h-2.5 w-2.5" />
                {completedTasks.length} Done
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Audit log of finished tasks with completion timestamps
            </p>
          </div>
        </div>

        {/* Mini Search within history if more than 3 tasks */}
        {completedTasks.length > 3 && (
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-1 pl-7 pr-2.5 text-xs text-zinc-800 placeholder:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-850 dark:text-zinc-200 focus:outline-hidden"
            />
          </div>
        )}
      </div>

      {/* Task Log List */}
      {filteredHistory.length > 0 ? (
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {filteredHistory.map((task) => {
            const catMeta = getCategoryConfig(task.category);
            const prioMeta = getPriorityConfig(task.priority);

            return (
              <div
                key={task.id}
                className="flex items-center justify-between gap-3 p-2 rounded-xl bg-zinc-50/70 dark:bg-zinc-850/40 border border-zinc-150/60 dark:border-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate line-through decoration-zinc-400">
                    {task.title}
                  </span>

                  {/* Category badge */}
                  <span
                    className={`hidden sm:inline-flex items-center rounded-md px-1.5 py-0.2 text-[9px] font-semibold border ${catMeta.badgeBg} ${catMeta.badgeText} ${catMeta.darkBadgeBg} ${catMeta.darkBadgeText}`}
                  >
                    #{task.category}
                  </span>

                  {/* Recurrence badge if present */}
                  {task.recurrence && task.recurrence !== 'none' && (
                    <span className="hidden sm:inline-flex items-center gap-0.5 rounded-md px-1 py-0.2 text-[9px] font-medium bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                      <Repeat className="h-2.5 w-2.5" />
                      {task.recurrence}
                    </span>
                  )}
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-1.5 shrink-0 text-zinc-400 dark:text-zinc-500 text-[10px]">
                  <Clock className="h-3 w-3" />
                  <span>{formatCompletedDate(task.completedAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-200 py-6 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
          {completedTasks.length === 0
            ? 'No completed tasks yet. Finish your tasks to build your activity history!'
            : 'No tasks match your search filter.'}
        </div>
      )}
    </div>
  );
};
