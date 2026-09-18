import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  CheckCircle2,
  Flame,
  Calendar,
  ChevronDown,
  ChevronUp,
  Activity,
  Target,
} from 'lucide-react';
import { TodoItem } from '../types';
import { FocusHistory } from './FocusHistory';
import { ActivityHistory } from './ActivityHistory';

interface DailyProductivityDashboardProps {
  todos: TodoItem[];
  isDark: boolean;
}

interface DayStat {
  dateStr: string; // YYYY-MM-DD
  dayLabel: string; // "Mon", "Tue", "Today"
  fullDateLabel: string; // "Sep 17, 2026"
  completed: number;
  total: number;
  isToday: boolean;
  completionRate: number;
}

export const DailyProductivityDashboard: React.FC<DailyProductivityDashboardProps> = ({
  todos,
  isDark,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Compute stats for the past 7 days
  const { chartData, streakDays, todayCompleted, weeklyCompletedTotal, weeklyAvgRate } =
    useMemo(() => {
      const now = new Date();
      const days: DayStat[] = [];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      // Generate the last 7 calendar days ending today
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const isToday = i === 0;

        const dayName = isToday ? 'Today' : dayNames[d.getDay()];
        const fullDateLabel = d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });

        // Count tasks completed on this day (via completedAt or dueDate for completed tasks)
        const completedCount = todos.filter((todo) => {
          if (!todo.completed) return false;
          if (todo.completedAt) {
            return todo.completedAt.split('T')[0] === dateStr;
          }
          // If no completedAt timestamp, fallback to dueDate or today if marked done
          if (todo.dueDate === dateStr) return true;
          return isToday;
        }).length;

        // Count total tasks related to this day (created or due or completed)
        const createdCount = todos.filter((todo) => {
          const createdDate = todo.createdAt ? todo.createdAt.split('T')[0] : '';
          const dueDate = todo.dueDate || '';
          return createdDate === dateStr || dueDate === dateStr;
        }).length;

        const totalActiveOrCreated = Math.max(completedCount, createdCount);
        const rate =
          totalActiveOrCreated > 0
            ? Math.round((completedCount / totalActiveOrCreated) * 100)
            : completedCount > 0
            ? 100
            : 0;

        days.push({
          dateStr,
          dayLabel: dayName,
          fullDateLabel,
          completed: completedCount,
          total: totalActiveOrCreated,
          isToday,
          completionRate: rate,
        });
      }

      // Calculate streak: consecutive days looking back from today (or yesterday if today has 0)
      let streak = 0;
      for (let i = days.length - 1; i >= 0; i--) {
        if (days[i].completed > 0) {
          streak++;
        } else if (i === days.length - 1) {
          // If today has 0, don't break streak yet if yesterday had completions
          continue;
        } else {
          break;
        }
      }

      const todayStat = days.find((d) => d.isToday);
      const totalWeeklyCompleted = days.reduce((sum, d) => sum + d.completed, 0);
      const daysWithActivity = days.filter((d) => d.total > 0).length || 1;
      const avgRate = Math.round(
        days.reduce((sum, d) => sum + d.completionRate, 0) / daysWithActivity
      );

      return {
        chartData: days,
        streakDays: streak,
        todayCompleted: todayStat ? todayStat.completed : 0,
        weeklyCompletedTotal: totalWeeklyCompleted,
        weeklyAvgRate: Math.min(100, avgRate),
      };
    }, [todos]);

  // Accent and bar color tokens
  const accentCompleted = isDark ? '#38bdf8' : '#0284c7'; // Sky
  const accentToday = isDark ? '#60a5fa' : '#2563eb'; // Blue
  const barBgMuted = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
  const gridLineColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';

  return (
    <section
      id="daily-productivity-dashboard"
      className="mb-6 overflow-hidden rounded-2xl border border-zinc-200/90 bg-white p-4 sm:p-5 shadow-xs transition-all dark:border-zinc-800 dark:bg-zinc-900/80"
      aria-label="Daily Productivity Dashboard"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-2xs dark:bg-zinc-100 dark:text-zinc-900">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Daily Productivity
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40">
                <Activity className="h-3 w-3" />
                7-Day Overview
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Visualizing completed tasks and daily consistency
            </p>
          </div>
        </div>

        <button
          type="button"
          id="toggle-productivity-dashboard-btn"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors cursor-pointer"
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? 'Expand productivity dashboard' : 'Collapse productivity dashboard'}
        >
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {/* Productivity Metric Chips */}
      <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800/80">
        {/* Today's Completed */}
        <div className="flex flex-col rounded-xl bg-zinc-50/80 p-2.5 dark:bg-zinc-800/40">
          <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-sky-500" />
            Today
          </span>
          <span className="mt-0.5 text-base font-bold text-zinc-900 dark:text-zinc-100">
            {todayCompleted} <span className="text-[11px] font-normal text-zinc-400">done</span>
          </span>
        </div>

        {/* 7-Day Completion Volume */}
        <div className="flex flex-col rounded-xl bg-zinc-50/80 p-2.5 dark:bg-zinc-800/40">
          <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            <Target className="h-3.5 w-3.5 text-emerald-500" />
            7-Day Total
          </span>
          <span className="mt-0.5 text-base font-bold text-zinc-900 dark:text-zinc-100">
            {weeklyCompletedTotal} <span className="text-[11px] font-normal text-zinc-400">tasks</span>
          </span>
        </div>

        {/* Active Productivity Streak */}
        <div className="flex flex-col rounded-xl bg-zinc-50/80 p-2.5 dark:bg-zinc-800/40">
          <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            <Flame className="h-3.5 w-3.5 text-amber-500" />
            Active Streak
          </span>
          <span className="mt-0.5 text-base font-bold text-zinc-900 dark:text-zinc-100">
            {streakDays} <span className="text-[11px] font-normal text-zinc-400">{streakDays === 1 ? 'day' : 'days'}</span>
          </span>
        </div>
      </div>

      {/* Main Chart Area (Collapsible) */}
      {!isCollapsed && (
        <div className="mt-4 pt-1">
          <div className="h-44 w-full" id="daily-productivity-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 12, right: 8, left: -24, bottom: 4 }}
                barGap={4}
              >
                <CartesianGrid
                  stroke={gridLineColor}
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="dayLabel"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: isDark ? '#a1a1aa' : '#71717a',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: isDark ? '#71717a' : '#a1a1aa',
                    fontSize: 10,
                  }}
                />
                <Tooltip
                  cursor={{
                    fill: barBgMuted,
                    radius: 8,
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as DayStat;
                      return (
                        <div className="rounded-xl border border-zinc-200/90 bg-white/95 p-2.5 shadow-lg backdrop-blur-xs dark:border-zinc-800 dark:bg-zinc-900/95">
                          <div className="flex items-center gap-1.5 mb-1.5 border-b border-zinc-100 pb-1 dark:border-zinc-800">
                            <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                              {data.fullDateLabel} {data.isToday ? '(Today)' : ''}
                            </span>
                          </div>
                          <div className="space-y-1 text-[11px]">
                            <div className="flex items-center justify-between gap-4 text-zinc-600 dark:text-zinc-400">
                              <span className="flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-sky-500" />
                                Tasks Completed
                              </span>
                              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                {data.completed}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-zinc-600 dark:text-zinc-400">
                              <span className="flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                Total Scheduled
                              </span>
                              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                                {data.total}
                              </span>
                            </div>
                            {data.total > 0 && (
                              <div className="border-t border-zinc-100 pt-1 mt-1 dark:border-zinc-800 flex items-center justify-between gap-4">
                                <span className="text-zinc-500 dark:text-zinc-400">Completion</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {data.completionRate}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="completed"
                  name="Completed Tasks"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={38}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isToday ? accentToday : accentCompleted}
                      fillOpacity={entry.completed === 0 ? 0.25 : 1}
                      stroke={entry.isToday ? (isDark ? '#ffffff' : '#0f172a') : undefined}
                      strokeWidth={entry.isToday ? 1.5 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Sub-legend */}
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                Completed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 ring-1 ring-zinc-900/40 dark:ring-white/40" />
                Today's Target
              </span>
            </div>
            <span>Avg Completion: {weeklyAvgRate}%</span>
          </div>

          {/* Focus History: Pomodoro Time Spent Per Day */}
          <FocusHistory isDark={isDark} />

          {/* Activity Analytics: Completed Tasks History Log */}
          <ActivityHistory todos={todos} />
        </div>
      )}
    </section>
  );
};
