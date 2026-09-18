// Utility for tracking and persisting daily Pomodoro focus sessions

export interface DailyFocusRecord {
  date: string; // 'YYYY-MM-DD'
  totalMinutes: number; // total minutes spent in focus
  sessionsCount: number; // number of completed Pomodoro sessions
  tasks?: string[]; // optional list of task names focused on
}

export const STORAGE_KEY_FOCUS_HISTORY = 'dio_pomodoro_focus_history';
export const FOCUS_HISTORY_EVENT = 'dio_focus_history_updated';

export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generates initial seed data for the past 7 days if no history exists yet.
 */
function getInitialSeedHistory(): Record<string, DailyFocusRecord> {
  const history: Record<string, DailyFocusRecord> = {};
  const now = new Date();

  // Seed sample session counts for the past 7 days
  // Day 0 (today): 50m (2 sessions)
  // Day 1 (yesterday): 75m (3 sessions)
  // Day 2: 50m (2 sessions)
  // Day 3: 100m (4 sessions)
  // Day 4: 25m (1 session)
  // Day 5: 50m (2 sessions)
  // Day 6: 0m (0 sessions)
  const sampleMinutes = [50, 75, 50, 100, 25, 50, 0];

  for (let i = 0; i < sampleMinutes.length; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dateStr = getLocalDateString(d);
    const mins = sampleMinutes[i];
    const sessions = Math.round(mins / 25);
    history[dateStr] = {
      date: dateStr,
      totalMinutes: mins,
      sessionsCount: sessions,
      tasks: sessions > 0 ? ['Project Sprint', 'Task Execution'] : [],
    };
  }

  return history;
}

/**
 * Retrieve all daily focus records from localStorage.
 */
export function getFocusHistory(): Record<string, DailyFocusRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FOCUS_HISTORY);
    if (!raw) {
      const initial = getInitialSeedHistory();
      localStorage.setItem(STORAGE_KEY_FOCUS_HISTORY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch {
    // Fallback on error
  }
  return {};
}

/**
 * Record a completed focus session or duration (default 25 min) for a specific date (defaults to today).
 */
export function recordFocusSession(
  minutes: number = 25,
  taskTitle?: string,
  targetDate?: string
): void {
  if (typeof window === 'undefined') return;
  try {
    const dateStr = targetDate || getLocalDateString(new Date());
    const currentHistory = getFocusHistory();

    const existing = currentHistory[dateStr] || {
      date: dateStr,
      totalMinutes: 0,
      sessionsCount: 0,
      tasks: [],
    };

    const newTasks = existing.tasks ? [...existing.tasks] : [];
    if (taskTitle && !newTasks.includes(taskTitle)) {
      newTasks.push(taskTitle);
    }

    currentHistory[dateStr] = {
      date: dateStr,
      totalMinutes: Math.max(0, existing.totalMinutes + minutes),
      sessionsCount: Math.max(0, existing.sessionsCount + (minutes >= 20 ? 1 : 0)),
      tasks: newTasks,
    };

    localStorage.setItem(STORAGE_KEY_FOCUS_HISTORY, JSON.stringify(currentHistory));

    // Dispatch event so UI updates immediately across components
    window.dispatchEvent(
      new CustomEvent(FOCUS_HISTORY_EVENT, {
        detail: { date: dateStr, record: currentHistory[dateStr] },
      })
    );
  } catch (err) {
    console.error('Failed to record focus session', err);
  }
}

/**
 * Format total minutes into human-readable string (e.g., "1 hr 15 mins" or "50 mins").
 */
export function formatFocusDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0 mins';
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  }
  if (hours > 0) {
    return `${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
  }
  return `${mins} mins`;
}

/**
 * Returns focus stats for the last N days (default 7 days).
 */
export interface DayFocusStat {
  dateStr: string;
  dayLabel: string;
  fullDateLabel: string;
  totalMinutes: number;
  sessionsCount: number;
  isToday: boolean;
  formattedDuration: string;
}

export function getLastNDaysFocusStats(daysCount: number = 7): DayFocusStat[] {
  const history = getFocusHistory();
  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayStr = getLocalDateString(now);

  const stats: DayFocusStat[] = [];

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dateStr = getLocalDateString(d);
    const isToday = dateStr === todayStr;
    const dayLabel = isToday ? 'Today' : dayNames[d.getDay()];
    const fullDateLabel = d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    const record = history[dateStr];
    const totalMinutes = record ? record.totalMinutes : 0;
    const sessionsCount = record ? record.sessionsCount : 0;

    stats.push({
      dateStr,
      dayLabel,
      fullDateLabel,
      totalMinutes,
      sessionsCount,
      isToday,
      formattedDuration: formatFocusDuration(totalMinutes),
    });
  }

  return stats;
}
