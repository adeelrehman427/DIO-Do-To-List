export type Priority = 'low' | 'medium' | 'high';
export type RecurrenceType = 'none' | 'daily' | 'weekly';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  category: string;
  priority: Priority;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM (24h)
  notifyWhenDue?: boolean; // Trigger alert/indicator when reached
  recurrence?: RecurrenceType; // 'none' | 'daily' | 'weekly'
  subtasks?: SubTask[];
  createdAt: string; // ISO string
  completedAt?: string; // ISO string
  order: number;
}

export type DueAlertSeverity = 'imminent' | 'overdue';

export interface DueToast {
  id: string;
  todoId: string;
  title: string;
  category: string;
  priority: Priority;
  severity: DueAlertSeverity;
  dueDate: string;
  dueTime?: string;
  timeRemainingText: string;
  minutesDifference: number;
  createdAt: number;
}

export type FilterStatus = 'all' | 'pending' | 'completed';
export type FilterPriority = 'all' | Priority;
export type FilterCategory = 'all' | string;
export type SortOption = 'custom' | 'dueDate' | 'priority' | 'alphabetical' | 'createdAt';
export type ThemeMode = 'light' | 'dark' | 'custom-blue';
export type ViewMode = 'list' | 'calendar';

export interface PriorityConfig {
  label: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
  darkBadgeBg: string;
  darkBadgeText: string;
  weight: number;
}

export interface CategoryConfig {
  name: string;
  badgeBg: string;
  badgeText: string;
  darkBadgeBg: string;
  darkBadgeText: string;
  borderColor: string;
}
