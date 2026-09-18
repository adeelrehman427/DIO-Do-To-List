import { Priority, PriorityConfig, CategoryConfig, TodoItem } from './types';

export const PRESET_CATEGORIES: string[] = [
  'Work',
  'Personal',
  'Urgent',
  'Study',
  'Health',
  'Home',
];

export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  Work: {
    name: 'Work',
    badgeBg: 'bg-indigo-50 border-indigo-200/70',
    badgeText: 'text-indigo-700',
    darkBadgeBg: 'dark:bg-indigo-950/40 dark:border-indigo-800/50',
    darkBadgeText: 'dark:text-indigo-300',
    borderColor: 'border-indigo-500',
  },
  Personal: {
    name: 'Personal',
    badgeBg: 'bg-purple-50 border-purple-200/70',
    badgeText: 'text-purple-700',
    darkBadgeBg: 'dark:bg-purple-950/40 dark:border-purple-800/50',
    darkBadgeText: 'dark:text-purple-300',
    borderColor: 'border-purple-500',
  },
  Urgent: {
    name: 'Urgent',
    badgeBg: 'bg-rose-50 border-rose-200/70',
    badgeText: 'text-rose-700',
    darkBadgeBg: 'dark:bg-rose-950/40 dark:border-rose-800/50',
    darkBadgeText: 'dark:text-rose-300',
    borderColor: 'border-rose-500',
  },
  Study: {
    name: 'Study',
    badgeBg: 'bg-amber-50 border-amber-200/70',
    badgeText: 'text-amber-700',
    darkBadgeBg: 'dark:bg-amber-950/40 dark:border-amber-800/50',
    darkBadgeText: 'dark:text-amber-300',
    borderColor: 'border-amber-500',
  },
  Health: {
    name: 'Health',
    badgeBg: 'bg-emerald-50 border-emerald-200/70',
    badgeText: 'text-emerald-700',
    darkBadgeBg: 'dark:bg-emerald-950/40 dark:border-emerald-800/50',
    darkBadgeText: 'dark:text-emerald-300',
    borderColor: 'border-emerald-500',
  },
  Home: {
    name: 'Home',
    badgeBg: 'bg-teal-50 border-teal-200/70',
    badgeText: 'text-teal-700',
    darkBadgeBg: 'dark:bg-teal-950/40 dark:border-teal-800/50',
    darkBadgeText: 'dark:text-teal-300',
    borderColor: 'border-teal-500',
  },
};

export const DYNAMIC_CATEGORY_PALETTES = [
  {
    badgeBg: 'bg-indigo-50 border-indigo-200/70',
    badgeText: 'text-indigo-700',
    darkBadgeBg: 'dark:bg-indigo-950/40 dark:border-indigo-800/50',
    darkBadgeText: 'dark:text-indigo-300',
    borderColor: 'border-indigo-500',
  },
  {
    badgeBg: 'bg-purple-50 border-purple-200/70',
    badgeText: 'text-purple-700',
    darkBadgeBg: 'dark:bg-purple-950/40 dark:border-purple-800/50',
    darkBadgeText: 'dark:text-purple-300',
    borderColor: 'border-purple-500',
  },
  {
    badgeBg: 'bg-rose-50 border-rose-200/70',
    badgeText: 'text-rose-700',
    darkBadgeBg: 'dark:bg-rose-950/40 dark:border-rose-800/50',
    darkBadgeText: 'dark:text-rose-300',
    borderColor: 'border-rose-500',
  },
  {
    badgeBg: 'bg-amber-50 border-amber-200/70',
    badgeText: 'text-amber-700',
    darkBadgeBg: 'dark:bg-amber-950/40 dark:border-amber-800/50',
    darkBadgeText: 'dark:text-amber-300',
    borderColor: 'border-amber-500',
  },
  {
    badgeBg: 'bg-emerald-50 border-emerald-200/70',
    badgeText: 'text-emerald-700',
    darkBadgeBg: 'dark:bg-emerald-950/40 dark:border-emerald-800/50',
    darkBadgeText: 'dark:text-emerald-300',
    borderColor: 'border-emerald-500',
  },
  {
    badgeBg: 'bg-teal-50 border-teal-200/70',
    badgeText: 'text-teal-700',
    darkBadgeBg: 'dark:bg-teal-950/40 dark:border-teal-800/50',
    darkBadgeText: 'dark:text-teal-300',
    borderColor: 'border-teal-500',
  },
  {
    badgeBg: 'bg-sky-50 border-sky-200/70',
    badgeText: 'text-sky-700',
    darkBadgeBg: 'dark:bg-sky-950/40 dark:border-sky-800/50',
    darkBadgeText: 'dark:text-sky-300',
    borderColor: 'border-sky-500',
  },
  {
    badgeBg: 'bg-blue-50 border-blue-200/70',
    badgeText: 'text-blue-700',
    darkBadgeBg: 'dark:bg-blue-950/40 dark:border-blue-800/50',
    darkBadgeText: 'dark:text-blue-300',
    borderColor: 'border-blue-500',
  },
  {
    badgeBg: 'bg-orange-50 border-orange-200/70',
    badgeText: 'text-orange-700',
    darkBadgeBg: 'dark:bg-orange-950/40 dark:border-orange-800/50',
    darkBadgeText: 'dark:text-orange-300',
    borderColor: 'border-orange-500',
  },
  {
    badgeBg: 'bg-fuchsia-50 border-fuchsia-200/70',
    badgeText: 'text-fuchsia-700',
    darkBadgeBg: 'dark:bg-fuchsia-950/40 dark:border-fuchsia-800/50',
    darkBadgeText: 'dark:text-fuchsia-300',
    borderColor: 'border-fuchsia-500',
  },
];

export function getCategoryConfig(category?: string): CategoryConfig {
  if (category && CATEGORY_CONFIG[category]) {
    return CATEGORY_CONFIG[category];
  }

  if (category && category !== 'General') {
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = (hash << 5) - hash + category.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % DYNAMIC_CATEGORY_PALETTES.length;
    const chosen = DYNAMIC_CATEGORY_PALETTES[idx];
    return {
      name: category,
      ...chosen,
    };
  }

  return {
    name: category || 'General',
    badgeBg: 'bg-zinc-100 border-zinc-200',
    badgeText: 'text-zinc-700',
    darkBadgeBg: 'dark:bg-zinc-800 dark:border-zinc-700',
    darkBadgeText: 'dark:text-zinc-300',
    borderColor: 'border-zinc-400',
  };
}

export const PRIORITY_CONFIG: Record<string, PriorityConfig> = {
  low: {
    label: 'Low',
    badgeBg: 'bg-emerald-50 border border-emerald-200/60',
    badgeText: 'text-emerald-700',
    dotColor: 'bg-emerald-500',
    darkBadgeBg: 'dark:bg-emerald-950/40 dark:border-emerald-800/40',
    darkBadgeText: 'dark:text-emerald-400',
    weight: 1,
  },
  medium: {
    label: 'Medium',
    badgeBg: 'bg-sky-50 border border-sky-200/60',
    badgeText: 'text-sky-700',
    dotColor: 'bg-sky-500',
    darkBadgeBg: 'dark:bg-sky-950/40 dark:border-sky-800/40',
    darkBadgeText: 'dark:text-sky-400',
    weight: 2,
  },
  high: {
    label: 'High',
    badgeBg: 'bg-amber-50 border border-amber-200/60',
    badgeText: 'text-amber-700',
    dotColor: 'bg-amber-500',
    darkBadgeBg: 'dark:bg-amber-950/40 dark:border-amber-800/40',
    darkBadgeText: 'dark:text-amber-400',
    weight: 3,
  },
  // Legacy fallback
  urgent: {
    label: 'High',
    badgeBg: 'bg-rose-50 border border-rose-200/60',
    badgeText: 'text-rose-700',
    dotColor: 'bg-rose-500',
    darkBadgeBg: 'dark:bg-rose-950/40 dark:border-rose-800/40',
    darkBadgeText: 'dark:text-rose-400',
    weight: 3,
  },
};

export function getPriorityConfig(priority?: string): PriorityConfig {
  if (priority && PRIORITY_CONFIG[priority]) {
    return PRIORITY_CONFIG[priority];
  }
  return PRIORITY_CONFIG.medium;
}

const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
const inThreeDays = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];
const todayStr = new Date().toISOString().split('T')[0];
const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const twoDaysAgoStr = new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0];
const threeDaysAgoStr = new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0];

// Dynamic imminent time: 20 minutes from now
const imminentDate = new Date(Date.now() + 20 * 60 * 1000);
const imminentTimeStr = `${String(imminentDate.getHours()).padStart(2, '0')}:${String(imminentDate.getMinutes()).padStart(2, '0')}`;

export const INITIAL_TODOS: TodoItem[] = [
  {
    id: 'task-overdue-1',
    title: 'Submit quarterly expense statement to finance',
    description: 'Verify receipts, departmental billing codes, and approval signatures',
    completed: false,
    category: 'Urgent',
    priority: 'high',
    dueDate: yesterdayStr,
    dueTime: '17:00',
    notifyWhenDue: true,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    order: 0,
  },
  {
    id: 'task-imminent-1',
    title: 'Client presentation rehearsal & slides check',
    description: 'Walk through product demo flow and verify live staging environment',
    completed: false,
    category: 'Work',
    priority: 'high',
    dueDate: todayStr,
    dueTime: imminentTimeStr,
    notifyWhenDue: true,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    order: 1,
  },
  {
    id: 'task-1',
    title: 'Review quarterly project deliverables and roadmap',
    description: 'Verify milestones with engineering lead and cross-functional team',
    completed: false,
    category: 'Work',
    priority: 'high',
    dueDate: tomorrow,
    dueTime: '15:00',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    order: 2,
  },
  {
    id: 'task-2',
    title: 'Finalize design system typography & color tokens',
    description: 'Ensure contrast passes WCAG AA standards across light and dark modes',
    completed: false,
    category: 'Work',
    priority: 'medium',
    dueDate: inThreeDays,
    dueTime: '11:00',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    order: 3,
  },
  {
    id: 'task-4',
    title: 'Conduct weekly team sync and retrospective',
    completed: true,
    category: 'Work',
    priority: 'medium',
    dueDate: todayStr,
    dueTime: '10:00',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    order: 4,
  },
  {
    id: 'task-5',
    title: 'Weekly grocery run and pantry organization',
    description: 'Fresh vegetables, almond milk, and meal prep essentials',
    completed: false,
    category: 'Personal',
    priority: 'low',
    dueDate: tomorrow,
    dueTime: '18:00',
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    order: 5,
  },
  {
    id: 'task-6',
    title: 'Update API schema documentation and examples',
    completed: true,
    category: 'Work',
    priority: 'high',
    dueDate: yesterdayStr,
    dueTime: '16:00',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    order: 6,
  },
  {
    id: 'task-7',
    title: 'Morning 5km endurance run and stretching',
    completed: true,
    category: 'Health',
    priority: 'low',
    dueDate: twoDaysAgoStr,
    dueTime: '07:30',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    order: 7,
  },
];

export const STORAGE_KEY_TODOS = 'todo_app_tasks_v3';
export const STORAGE_KEY_THEME = 'todo_app_theme_mode';
export const STORAGE_KEY_CATEGORIES = 'todo_app_categories_v1';

