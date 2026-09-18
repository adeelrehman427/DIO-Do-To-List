export function formatTime12h(timeStr?: string): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (isNaN(h)) return '';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

export function formatDueDate(dateStr?: string, timeStr?: string): {
  label: string;
  isOverdue: boolean;
  isToday: boolean;
  isTomorrow: boolean;
} {
  if (!dateStr) {
    return { label: '', isOverdue: false, isToday: false, isTomorrow: false };
  }

  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr ? timeStr.split(':').map(Number) : [23, 59];

  const targetDate = new Date(year, month - 1, day, hours || 0, minutes || 0);
  const now = new Date();

  // Compare calendar days
  const todayCalendar = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetCalendar = new Date(year, month - 1, day);
  const diffDays = Math.round((targetCalendar.getTime() - todayCalendar.getTime()) / (1000 * 60 * 60 * 24));

  const timeSuffix = timeStr ? ` at ${formatTime12h(timeStr)}` : '';

  // Is overdue? Check timestamp if today or in past
  const isOverdue = targetDate.getTime() < now.getTime();

  if (diffDays === 0) {
    return {
      label: isOverdue ? `Overdue today${timeSuffix}` : `Due today${timeSuffix}`,
      isOverdue,
      isToday: true,
      isTomorrow: false,
    };
  }

  if (diffDays === 1) {
    return {
      label: `Due tomorrow${timeSuffix}`,
      isOverdue: false,
      isToday: false,
      isTomorrow: true,
    };
  }

  if (diffDays === -1) {
    return {
      label: `Overdue (yesterday${timeSuffix})`,
      isOverdue: true,
      isToday: false,
      isTomorrow: false,
    };
  }

  if (diffDays < -1) {
    const absDays = Math.abs(diffDays);
    return {
      label: `Overdue by ${absDays} days${timeSuffix}`,
      isOverdue: true,
      isToday: false,
      isTomorrow: false,
    };
  }

  const formattedDate = targetCalendar.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: targetCalendar.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });

  return {
    label: `Due ${formattedDate}${timeSuffix}`,
    isOverdue: false,
    isToday: false,
    isTomorrow: false,
  };
}

export function generateId(): string {
  return 'task_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
}
