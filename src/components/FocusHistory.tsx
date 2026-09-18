import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Timer,
  Clock,
  Brain,
  Plus,
  Flame,
  Calendar,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  getLastNDaysFocusStats,
  recordFocusSession,
  formatFocusDuration,
  FOCUS_HISTORY_EVENT,
  DayFocusStat,
} from '../utils/focusHistory';
import { hapticButtonClick, hapticTaskComplete } from '../utils/haptics';

interface FocusHistoryProps {
  isDark: boolean;
}

export const FocusHistory: React.FC<FocusHistoryProps> = ({ isDark }) => {
  const [stats, setStats] = useState<DayFocusStat[]>(() => getLastNDaysFocusStats(7));
  const [justLogged, setJustLogged] = useState<boolean>(false);

  const refreshStats = useCallback(() => {
    setStats(getLastNDaysFocusStats(7));
  }, []);

  useEffect(() => {
    // Listen for custom events triggered by Pomodoro completion or manual logs
    const handleUpdate = () => {
      refreshStats();
    };

    window.addEventListener(FOCUS_HISTORY_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(FOCUS_HISTORY_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refreshStats]);

  // Aggregate metrics
  const { todayStat, totalMinutes7Days, totalSessions7Days, avgMinutesPerDay, maxMinutesInDay } =
    useMemo(() => {
      const today = stats.find((s) => s.isToday);
      const totalMins = stats.reduce((acc, curr) => acc + curr.totalMinutes, 0);
      const totalSessions = stats.reduce((acc, curr) => acc + curr.sessionsCount, 0);
      const activeDays = stats.filter((s) => s.totalMinutes > 0).length || 1;
      const avgMins = Math.round(totalMins / 7);
      const maxMins = Math.max(...stats.map((s) => s.totalMinutes), 60); // min scale of 60 mins

      return {
        todayStat: today || stats[stats.length - 1],
        totalMinutes7Days: totalMins,
        totalSessions7Days: totalSessions,
        avgMinutesPerDay: avgMins,
        maxMinutesInDay: maxMins,
      };
    }, [stats]);

  const handleQuickLog25 = () => {
    hapticTaskComplete();
    recordFocusSession(25, 'Quick Focus Session');
    setJustLogged(true);
    setTimeout(() => setJustLogged(false), 1800);
  };

  return (
    <div
      id="focus-history-section"
      className="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800/80"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40">
            <Timer className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Focus History
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.2 text-[10px] font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/40 dark:border-rose-900/40">
                <Brain className="h-2.5 w-2.5" />
                Pomodoro Time
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Total time spent in Pomodoro sessions per day
            </p>
          </div>
        </div>

        {/* Quick Log Action Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            id="quick-log-focus-btn"
            onClick={handleQuickLog25}
            title="Log a 25-minute Pomodoro focus session"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700/80 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-750 transition-all cursor-pointer shadow-2xs"
          >
            {justLogged ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                <span className="text-emerald-700 dark:text-emerald-300 font-bold">+25m Logged!</span>
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5 text-rose-500" />
                <span>+25m Focus</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Focus Summary Cards */}
      <div className="grid grid-cols-3 gap-2 mb-3.5">
        {/* Today's Focus Time */}
        <div className="rounded-xl bg-zinc-50/90 p-2.5 dark:bg-zinc-800/40 border border-zinc-150/60 dark:border-zinc-800/50">
          <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            <Clock className="h-3.5 w-3.5 text-rose-500" />
            Today's Focus
          </span>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {todayStat?.formattedDuration || '0 mins'}
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
              ({todayStat?.sessionsCount || 0} {todayStat?.sessionsCount === 1 ? 'session' : 'sessions'})
            </span>
          </div>
        </div>

        {/* 7-Day Total Focus Time */}
        <div className="rounded-xl bg-zinc-50/90 p-2.5 dark:bg-zinc-800/40 border border-zinc-150/60 dark:border-zinc-800/50">
          <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            7-Day Focus
          </span>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {formatFocusDuration(totalMinutes7Days)}
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
              ({totalSessions7Days} {totalSessions7Days === 1 ? 'session' : 'sessions'})
            </span>
          </div>
        </div>

        {/* Daily Average Focus Time */}
        <div className="rounded-xl bg-zinc-50/90 p-2.5 dark:bg-zinc-800/40 border border-zinc-150/60 dark:border-zinc-800/50">
          <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            <Flame className="h-3.5 w-3.5 text-indigo-500" />
            Daily Average
          </span>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {formatFocusDuration(avgMinutesPerDay)}
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
              / day
            </span>
          </div>
        </div>
      </div>

      {/* Day-by-Day Daily Focus Sessions Breakdown */}
      <div className="space-y-1.5">
        {stats.map((day) => {
          // Calculate percentage width for visual focus bar
          const percent = maxMinutesInDay > 0 ? Math.min(100, Math.round((day.totalMinutes / maxMinutesInDay) * 100)) : 0;
          const hasTime = day.totalMinutes > 0;

          return (
            <div
              key={day.dateStr}
              className={`flex items-center justify-between gap-3 p-2 sm:px-3 sm:py-2 rounded-xl transition-all ${
                day.isToday
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40'
                  : 'bg-zinc-50/40 dark:bg-zinc-800/20 border border-transparent hover:border-zinc-200/60 dark:hover:border-zinc-800/60'
              }`}
            >
              {/* Day Label & Date */}
              <div className="w-28 sm:w-36 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-semibold ${
                      day.isToday
                        ? 'text-rose-600 dark:text-rose-400 font-bold'
                        : 'text-zinc-800 dark:text-zinc-200'
                    }`}
                  >
                    {day.dayLabel}
                  </span>
                  {day.isToday && (
                    <span className="rounded-md bg-rose-100 dark:bg-rose-900/50 px-1 py-0.2 text-[9px] font-bold text-rose-700 dark:text-rose-300">
                      Today
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">
                  {day.fullDateLabel}
                </span>
              </div>

              {/* Visual Duration Progress Bar */}
              <div className="flex-1 min-w-[60px] max-w-[220px] sm:max-w-none">
                <div className="h-2 w-full rounded-full bg-zinc-200/80 dark:bg-zinc-800 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      day.isToday
                        ? 'bg-rose-500 dark:bg-rose-400'
                        : hasTime
                        ? 'bg-amber-500/90 dark:bg-amber-400/90'
                        : 'bg-zinc-300 dark:bg-zinc-700'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${hasTime ? Math.max(percent, 4) : 0}%` }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Total Time & Sessions Readout */}
              <div className="text-right shrink-0 min-w-[90px] sm:min-w-[110px]">
                <div className="flex items-center justify-end gap-1.5">
                  <span
                    className={`text-xs font-bold tabular-nums ${
                      hasTime
                        ? day.isToday
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-zinc-900 dark:text-zinc-100'
                        : 'text-zinc-400 dark:text-zinc-500 font-normal'
                    }`}
                  >
                    {day.formattedDuration}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">
                  {day.sessionsCount} {day.sessionsCount === 1 ? 'session' : 'sessions'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
