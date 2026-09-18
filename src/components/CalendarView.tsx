import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  CheckCircle2,
  Check,
  Plus,
  Trash2,
  Edit3,
  CornerDownRight,
  ListChecks,
} from 'lucide-react';
import { TodoItem, Priority } from '../types';
import { PRIORITY_CONFIG, getCategoryConfig } from '../constants';
import { hapticButtonClick, hapticDelete, hapticTaskComplete, hapticTaskUncomplete } from '../utils/haptics';

interface CalendarViewProps {
  todos: TodoItem[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: Partial<Omit<TodoItem, 'id' | 'createdAt'>>) => void;
  onAddTaskWithDate?: (title: string, date: string) => void;
  onAddSubtask?: (todoId: string, title: string) => void;
  onToggleSubtask?: (todoId: string, subtaskId: string) => void;
  onDeleteSubtask?: (todoId: string, subtaskId: string) => void;
  categories?: string[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarView: React.FC<CalendarViewProps> = ({
  todos,
  onToggle,
  onDelete,
  onEdit,
  onAddTaskWithDate,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}) => {
  // Current calendar month navigation
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  
  // Format today's date YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Selected day for the detailed view
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [quickTaskTitle, setQuickTaskTitle] = useState<string>('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Next / Prev Month actions
  const handlePrevMonth = () => {
    hapticButtonClick();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    hapticButtonClick();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    hapticButtonClick();
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDateStr(todayStr);
  };

  // Map of date string -> tasks
  const tasksByDate = useMemo(() => {
    const map = new Map<string, TodoItem[]>();
    for (const todo of todos) {
      if (todo.dueDate) {
        const list = map.get(todo.dueDate) || [];
        list.push(todo);
        map.set(todo.dueDate, list);
      }
    }
    return map;
  }, [todos]);

  // Generate calendar grid cells (42 or 35 cells)
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: {
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      tasks: TodoItem[];
    }[] = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({
        dateStr,
        dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDateStr,
        tasks: tasksByDate.get(dateStr) || [],
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({
        dateStr,
        dayNum,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDateStr,
        tasks: tasksByDate.get(dateStr) || [],
      });
    }

    // Next month padding to fill grid
    const remaining = 42 - cells.length;
    if (remaining > 0 && remaining < 7) {
      for (let dayNum = 1; dayNum <= remaining; dayNum++) {
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        cells.push({
          dateStr,
          dayNum,
          isCurrentMonth: false,
          isToday: dateStr === todayStr,
          isSelected: dateStr === selectedDateStr,
          tasks: tasksByDate.get(dateStr) || [],
        });
      }
    } else if (remaining >= 7 && cells.length <= 35) {
      const toAdd = 35 - cells.length;
      for (let dayNum = 1; dayNum <= toAdd; dayNum++) {
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        cells.push({
          dateStr,
          dayNum,
          isCurrentMonth: false,
          isToday: dateStr === todayStr,
          isSelected: dateStr === selectedDateStr,
          tasks: tasksByDate.get(dateStr) || [],
        });
      }
    }

    return cells;
  }, [year, month, todayStr, selectedDateStr, tasksByDate]);

  // Tasks for the month statistics
  const monthStats = useMemo(() => {
    let totalInMonth = 0;
    let completedInMonth = 0;
    let overdueInMonth = 0;

    for (const cell of calendarCells) {
      if (cell.isCurrentMonth) {
        for (const t of cell.tasks) {
          totalInMonth++;
          if (t.completed) completedInMonth++;
          else if (t.dueDate && t.dueDate < todayStr) overdueInMonth++;
        }
      }
    }

    return { totalInMonth, completedInMonth, overdueInMonth };
  }, [calendarCells, todayStr]);

  // Selected date tasks
  const selectedDayTasks = tasksByDate.get(selectedDateStr) || [];

  // Formatted selected date label
  const formattedSelectedDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return selectedDateStr;
    }
  }, [selectedDateStr]);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim() || !onAddTaskWithDate) return;
    hapticButtonClick();
    onAddTaskWithDate(quickTaskTitle.trim(), selectedDateStr);
    setQuickTaskTitle('');
  };

  return (
    <div id="calendar-view-container" className="space-y-4">
      {/* Calendar Header with Navigation Controls and Month Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>{MONTH_NAMES[month]} {year}</span>
            </h2>
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              <span>{monthStats.totalInMonth} deadlines</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {monthStats.completedInMonth} completed
              </span>
              {monthStats.overdueInMonth > 0 && (
                <>
                  <span>•</span>
                  <span className="text-rose-600 dark:text-rose-400 font-medium">
                    {monthStats.overdueInMonth} overdue
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Month Switching Buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <button
            type="button"
            id="cal-prev-month-btn"
            onClick={handlePrevMonth}
            aria-label="Previous month"
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            id="cal-today-btn"
            onClick={handleGoToday}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            id="cal-next-month-btn"
            onClick={handleNextMonth}
            aria-label="Next month"
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 7-Column Monthly Calendar Grid */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
        {/* Day Names Header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {DAY_NAMES.map((d, index) => (
            <div
              key={d}
              className={`text-center text-[11px] sm:text-xs font-bold uppercase tracking-wider py-1 select-none ${
                index === 0 || index === 6
                  ? 'text-zinc-400 dark:text-zinc-500'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day Grid Cells */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarCells.map((cell) => {
            const hasTasks = cell.tasks.length > 0;
            const completedAll = hasTasks && cell.tasks.every((t) => t.completed);
            const hasOverdue =
              hasTasks &&
              !completedAll &&
              cell.dateStr < todayStr &&
              cell.tasks.some((t) => !t.completed);

            return (
              <button
                key={cell.dateStr}
                type="button"
                onClick={() => {
                  hapticButtonClick();
                  setSelectedDateStr(cell.dateStr);
                }}
                className={`flex flex-col items-start p-1 sm:p-2 rounded-xl min-h-[58px] sm:min-h-[88px] text-left transition-all relative border cursor-pointer select-none ${
                  cell.isSelected
                    ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/40 dark:bg-sky-950/20'
                    : cell.isToday
                    ? 'border-zinc-400 dark:border-zinc-600 bg-zinc-50/80 dark:bg-zinc-850/60'
                    : cell.isCurrentMonth
                    ? 'border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/30 dark:bg-zinc-850/30 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50'
                    : 'border-transparent bg-transparent opacity-35 hover:opacity-70'
                }`}
              >
                {/* Date Number Header */}
                <div className="w-full flex items-center justify-between">
                  <span
                    className={`inline-flex items-center justify-center text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                      cell.isToday
                        ? 'bg-sky-600 text-white shadow-xs'
                        : cell.isSelected
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {cell.dayNum}
                  </span>

                  {/* High priority or overdue indicator indicator on top right */}
                  {hasOverdue ? (
                    <span
                      title="Overdue tasks"
                      className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"
                    />
                  ) : hasTasks && completedAll ? (
                    <span
                      title="All completed"
                      className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                    />
                  ) : null}
                </div>

                {/* Tasks List inside cell (Desktop & Mobile view) */}
                <div className="w-full mt-1 space-y-0.5 overflow-hidden">
                  {/* Desktop chips */}
                  <div className="hidden sm:block space-y-1">
                    {cell.tasks.slice(0, 2).map((task) => {
                      const priorityDot =
                        task.priority === 'high'
                          ? 'bg-rose-500'
                          : task.priority === 'medium'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500';

                      return (
                        <div
                          key={task.id}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${
                            task.completed
                              ? 'line-through text-zinc-400 dark:text-zinc-500 bg-zinc-100/60 dark:bg-zinc-800/40'
                              : 'text-zinc-800 dark:text-zinc-200 bg-white/80 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-zinc-700/50 shadow-2xs'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${priorityDot}`} />
                          <span className="truncate">{task.title}</span>
                        </div>
                      );
                    })}
                    {cell.tasks.length > 2 && (
                      <div className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 pl-1">
                        +{cell.tasks.length - 2} more
                      </div>
                    )}
                  </div>

                  {/* Mobile badge dots */}
                  <div className="sm:hidden flex flex-wrap gap-0.5 mt-0.5">
                    {cell.tasks.slice(0, 4).map((task) => (
                      <span
                        key={task.id}
                        className={`h-1.5 w-1.5 rounded-full ${
                          task.completed
                            ? 'bg-zinc-300 dark:bg-zinc-600'
                            : task.priority === 'high'
                            ? 'bg-rose-500'
                            : task.priority === 'medium'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                    ))}
                    {cell.tasks.length > 4 && (
                      <span className="text-[8px] text-zinc-400">+</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Inspector & Quick Add Shortcut */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {formattedSelectedDate}
              </span>
              {selectedDateStr === todayStr && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                  Today
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {selectedDayTasks.length === 0
                ? 'No tasks scheduled for this day.'
                : `${selectedDayTasks.length} task${selectedDayTasks.length > 1 ? 's' : ''} scheduled (${
                    selectedDayTasks.filter((t) => t.completed).length
                  } completed)`}
            </p>
          </div>

          {/* Quick Task Add for Selected Date */}
          {onAddTaskWithDate && (
            <form onSubmit={handleQuickAdd} className="flex items-center gap-1.5 w-full sm:w-auto">
              <input
                type="text"
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                placeholder="Add task for this date..."
                className="flex-1 sm:w-56 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              />
              <button
                type="submit"
                disabled={!quickTaskTitle.trim()}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-1 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </form>
          )}
        </div>

        {/* List of Tasks on Selected Date */}
        {selectedDayTasks.length > 0 ? (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {selectedDayTasks.map((todo) => {
                const priorityCfg = PRIORITY_CONFIG[todo.priority];
                const catCfg = getCategoryConfig(todo.category);
                const isOverdue = !todo.completed && todo.dueDate && todo.dueDate < todayStr;

                return (
                  <motion.li
                    key={todo.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                    className={`flex items-start justify-between gap-3 p-3 rounded-xl border transition-all ${
                      todo.completed
                        ? 'bg-zinc-50/50 border-zinc-200/60 dark:bg-zinc-850/40 dark:border-zinc-800/60'
                        : isOverdue
                        ? 'bg-rose-50/40 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50'
                        : 'bg-zinc-50/80 border-zinc-200 dark:bg-zinc-800/60 dark:border-zinc-700/60'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => {
                          if (todo.completed) hapticTaskUncomplete();
                          else hapticTaskComplete();
                          onToggle(todo.id);
                        }}
                        aria-label={todo.completed ? 'Mark pending' : 'Mark completed'}
                        className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border transition-all cursor-pointer"
                      >
                        {todo.completed ? (
                          <div className="h-4.5 w-4.5 rounded-md bg-zinc-900 text-white flex items-center justify-center dark:bg-zinc-100 dark:text-zinc-900">
                            <Check className="h-3 w-3 stroke-[2.5]" />
                          </div>
                        ) : (
                          <div className="h-4.5 w-4.5 rounded-md border-2 border-zinc-300 dark:border-zinc-600 hover:border-zinc-500 transition-colors" />
                        )}
                      </button>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-xs font-semibold leading-tight break-words ${
                              todo.completed
                                ? 'line-through text-zinc-400 dark:text-zinc-500'
                                : 'text-zinc-900 dark:text-zinc-100'
                            }`}
                          >
                            {todo.title}
                          </span>

                          {/* Category badge */}
                          {todo.category && (
                            <span
                              className={`inline-flex items-center rounded-md px-1.5 py-0.2 text-[10px] font-semibold border ${catCfg.badgeBg} ${catCfg.badgeText} ${catCfg.darkBadgeBg} ${catCfg.darkBadgeText}`}
                            >
                              #{todo.category}
                            </span>
                          )}

                          {/* Priority badge */}
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.2 text-[10px] font-semibold ${priorityCfg.badgeBg} ${priorityCfg.badgeText} ${priorityCfg.darkBadgeBg} ${priorityCfg.darkBadgeText}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${priorityCfg.dotColor}`} />
                            {priorityCfg.label}
                          </span>

                          {/* Time badge if specified */}
                          {todo.dueTime && (
                            <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.2 text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                              <Clock className="h-3 w-3 text-zinc-400" />
                              <span>{todo.dueTime}</span>
                            </span>
                          )}

                          {/* Subtasks counter */}
                          {todo.subtasks && todo.subtasks.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.2 text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800">
                              <ListChecks className="h-3 w-3" />
                              <span>
                                {todo.subtasks.filter((s) => s.completed).length}/
                                {todo.subtasks.length}
                              </span>
                            </span>
                          )}
                        </div>

                        {todo.description && (
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                            {todo.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Delete action */}
                    <button
                      type="button"
                      onClick={() => {
                        hapticDelete();
                        onDelete(todo.id);
                      }}
                      aria-label="Delete task"
                      className="text-zinc-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 p-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        ) : (
          <div className="py-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
            <CheckCircle2 className="h-6 w-6 mx-auto mb-1.5 opacity-30" />
            <span>No deadlines set for this day. Click on another date or use the quick input above.</span>
          </div>
        )}
      </div>
    </div>
  );
};
