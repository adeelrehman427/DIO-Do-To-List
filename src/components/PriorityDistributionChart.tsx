import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { BarChart3, CheckCircle2, Clock } from 'lucide-react';
import { TodoItem, Priority, FilterPriority } from '../types';
import { PRIORITY_CONFIG, getPriorityConfig } from '../constants';

interface PriorityDistributionChartProps {
  todos: TodoItem[];
  filterPriority: FilterPriority;
  onSelectPriority: (priority: FilterPriority) => void;
  isDark: boolean;
}

interface PriorityDataPoint {
  priority: Priority;
  name: string;
  total: number;
  active: number;
  completed: number;
  lightColor: string;
  darkColor: string;
}

const PRIORITY_PALETTE: Record<Priority, { light: string; dark: string }> = {
  low: { light: '#10b981', dark: '#34d399' },    // Emerald
  medium: { light: '#0ea5e9', dark: '#38bdf8' }, // Sky
  high: { light: '#f59e0b', dark: '#fbbf24' },   // Amber
};

export const PriorityDistributionChart: React.FC<PriorityDistributionChartProps> = ({
  todos,
  filterPriority,
  onSelectPriority,
  isDark,
}) => {
  const chartData = useMemo<PriorityDataPoint[]>(() => {
    // Explicit priority levels: Low, Medium, High
    const priorityLevels: Priority[] = ['low', 'medium', 'high'];

    return priorityLevels.map((p) => {
      const matched = todos.filter((t) => {
        const normalized = (t.priority as string) === 'urgent' ? 'high' : (t.priority || 'medium');
        return normalized === p;
      });
      const completed = matched.filter((t) => t.completed).length;
      const active = matched.length - completed;

      return {
        priority: p,
        name: getPriorityConfig(p).label,
        total: matched.length,
        active,
        completed,
        lightColor: PRIORITY_PALETTE[p].light,
        darkColor: PRIORITY_PALETTE[p].dark,
      };
    });
  }, [todos]);

  const totalTasks = todos.length;

  if (totalTasks === 0) {
    return null;
  }

  return (
    <div
      id="priority-chart-card"
      className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white p-4 sm:p-5 shadow-xs transition-colors dark:border-zinc-800 dark:bg-zinc-900/70"
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-display">
              Tasks by Priority Level
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Distribution across Low, Medium, and High ({totalTasks} total)
            </p>
          </div>
        </div>

        {filterPriority !== 'all' && (
          <button
            type="button"
            id="clear-chart-priority-filter"
            onClick={() => onSelectPriority('all')}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 underline text-left sm:text-right"
          >
            Clear priority filter
          </button>
        )}
      </div>

      {/* Recharts Bar Chart */}
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 12, right: 12, left: -24, bottom: 4 }}
            onClick={(state: any) => {
              if (state && state.activePayload && state.activePayload.length > 0) {
                const clickedPriority = state.activePayload[0].payload.priority as Priority;
                onSelectPriority(filterPriority === clickedPriority ? 'all' : clickedPriority);
              }
            }}
          >
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: isDark ? '#a1a1aa' : '#71717a',
                fontSize: 12,
                fontWeight: 600,
              }}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{
                fill: isDark ? '#71717a' : '#a1a1aa',
                fontSize: 11,
              }}
            />
            <Tooltip
              cursor={{
                fill: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                radius: 8,
              }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as PriorityDataPoint;
                  const color = isDark ? data.darkColor : data.lightColor;
                  return (
                    <div className="rounded-xl border border-zinc-200/90 bg-white/95 p-2.5 shadow-lg backdrop-blur-xs dark:border-zinc-800 dark:bg-zinc-900/95">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {data.name} Priority
                        </span>
                      </div>
                      <div className="space-y-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-zinc-400" />
                            Active
                          </span>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                            {data.active}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            Completed
                          </span>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                            {data.completed}
                          </span>
                        </div>
                        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-1 mt-1 flex items-center justify-between gap-4 font-medium">
                          <span>Total</span>
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">
                            {data.total}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="total"
              radius={[6, 6, 0, 0]}
              maxBarSize={52}
              className="cursor-pointer"
            >
              {chartData.map((entry) => {
                const isSelected = filterPriority === entry.priority;
                const isFilteredOut = filterPriority !== 'all' && !isSelected;
                const fillColor = isDark ? entry.darkColor : entry.lightColor;

                return (
                  <Cell
                    key={entry.priority}
                    fill={fillColor}
                    fillOpacity={isFilteredOut ? 0.25 : 1}
                    stroke={isSelected ? (isDark ? '#ffffff' : '#18181b') : undefined}
                    strokeWidth={isSelected ? 1.5 : 0}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Priority stats footer cards */}
      <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
        {chartData.map((d) => {
          const isSelected = filterPriority === d.priority;
          const color = isDark ? d.darkColor : d.lightColor;
          return (
            <button
              key={d.priority}
              type="button"
              id={`chart-priority-filter-${d.priority}`}
              onClick={() => onSelectPriority(isSelected ? 'all' : d.priority)}
              className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition-all text-left ${
                isSelected
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'bg-zinc-50/80 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="font-medium text-[11px]">{d.name}</span>
              </div>
              <span
                className={`text-[11px] font-bold ${
                  isSelected
                    ? 'text-white dark:text-zinc-900'
                    : 'text-zinc-900 dark:text-zinc-100'
                }`}
              >
                {d.total}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
