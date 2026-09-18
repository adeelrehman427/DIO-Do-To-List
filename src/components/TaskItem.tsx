import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  Calendar,
  Trash2,
  Edit3,
  AlertCircle,
  Clock,
  GripVertical,
  Tag,
  CheckSquare,
  Square,
  Bell,
  BellRing,
  ListChecks,
  Plus,
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  Repeat,
  Mic,
  MicOff,
} from 'lucide-react';
import { TodoItem, Priority, RecurrenceType } from '../types';
import { PRIORITY_CONFIG, PRESET_CATEGORIES, getPriorityConfig, getCategoryConfig } from '../constants';
import { formatDueDate } from '../utils';
import { ConfettiSparkles } from './ConfettiSparkles';
import { RichTextNotesView, RichTextToolbar } from './RichTextNotes';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import {
  hapticTaskComplete,
  hapticTaskUncomplete,
  hapticButtonClick,
  hapticDelete,
  hapticDragStart,
  hapticDragDrop,
} from '../utils/haptics';

interface TaskItemProps {
  todo: TodoItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: Partial<Omit<TodoItem, 'id' | 'createdAt'>>) => void;
  categories?: string[];
  onAddSubtask?: (todoId: string, title: string) => void;
  onToggleSubtask?: (todoId: string, subtaskId: string) => void;
  onDeleteSubtask?: (todoId: string, subtaskId: string) => void;
  onDragStartItem?: (id: string) => void;
  onDragOverItem?: (e: React.DragEvent, id: string) => void;
  onDropItem?: (id: string) => void;
  onTouchStartItem?: (id: string) => void;
  onTouchMoveItem?: (e: React.TouchEvent) => void;
  onTouchEndItem?: () => void;
  isDragOver?: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  todo,
  onToggle,
  onDelete,
  onEdit,
  categories = PRESET_CATEGORIES,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onDragStartItem,
  onDragOverItem,
  onDropItem,
  onTouchStartItem,
  onTouchMoveItem,
  onTouchEndItem,
  isDragOver,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description || '');
  const [editCategory, setEditCategory] = useState(todo.category || 'Work');
  const [customEditCategory, setCustomEditCategory] = useState('');
  const [isCustomEditCategory, setIsCustomEditCategory] = useState(false);
  const [editPriority, setEditPriority] = useState<Priority>(
    (todo.priority as string) === 'urgent' ? 'high' : (todo.priority || 'medium')
  );
  const [editDueDate, setEditDueDate] = useState<string>(todo.dueDate || '');
  const [editDueTime, setEditDueTime] = useState<string>(todo.dueTime || '');
  const [editNotifyWhenDue, setEditNotifyWhenDue] = useState<boolean>(!!todo.notifyWhenDue);
  const [editRecurrence, setEditRecurrence] = useState<RecurrenceType>(todo.recurrence || 'none');
  const editDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const [showSparkles, setShowSparkles] = useState<boolean>(false);
  const [isSubtasksOpen, setIsSubtasksOpen] = useState<boolean>(() => Boolean(todo.subtasks && todo.subtasks.length > 0));
  const [newSubtaskTitle, setNewSubtaskTitle] = useState<string>('');
  const prevCompletedRef = useRef<boolean>(todo.completed);

  const {
    isSupported: isSubtaskSpeechSupported,
    isListening: isSubtaskListening,
    startListening: startSubtaskListening,
    stopListening: stopSubtaskListening,
  } = useSpeechRecognition();

  const handleToggleSubtaskVoice = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    hapticButtonClick();
    if (isSubtaskListening) {
      stopSubtaskListening();
    } else {
      startSubtaskListening({
        onInterim: (interim) => {
          setNewSubtaskTitle(interim);
        },
        onFinal: (final) => {
          setNewSubtaskTitle(final);
        },
      });
    }
  };

  // Trigger sparkle effect and tactile vibration whenever task completion changes
  useEffect(() => {
    if (!prevCompletedRef.current && todo.completed) {
      setShowSparkles(true);
      hapticTaskComplete();
    } else if (prevCompletedRef.current && !todo.completed) {
      hapticTaskUncomplete();
    }
    prevCompletedRef.current = todo.completed;
  }, [todo.completed]);

  const priorityMeta = getPriorityConfig(todo.priority);
  const categoryMeta = getCategoryConfig(todo.category);
  const dueInfo = formatDueDate(todo.dueDate, todo.dueTime);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    hapticButtonClick();

    const chosenCategory = isCustomEditCategory
      ? (customEditCategory.trim() || 'General')
      : editCategory;

    onEdit(todo.id, {
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
      category: chosenCategory,
      priority: editPriority,
      dueDate: editDueDate || undefined,
      dueTime: editDueTime || undefined,
      notifyWhenDue: editNotifyWhenDue,
      recurrence: editRecurrence !== 'none' ? editRecurrence : undefined,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    hapticButtonClick();
    setEditTitle(todo.title);
    setEditDescription(todo.description || '');
    setEditCategory(todo.category || 'Work');
    setEditPriority(todo.priority);
    setEditDueDate(todo.dueDate || '');
    setEditDueTime(todo.dueTime || '');
    setEditNotifyWhenDue(!!todo.notifyWhenDue);
    setEditRecurrence(todo.recurrence || 'none');
    setIsEditing(false);
  };

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
      id={`task-item-${todo.id}`}
      data-task-id={todo.id}
      className="list-none"
    >
      <div
        draggable={!isEditing && !isSelectionMode}
        onClick={isSelectionMode ? () => onToggleSelect?.(todo.id) : undefined}
        onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
          if (isSelectionMode) return;
          e.dataTransfer.setData('text/plain', todo.id);
          e.dataTransfer.effectAllowed = 'move';
          hapticDragStart();
          onDragStartItem?.(todo.id);
        }}
        onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
          if (isSelectionMode) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          onDragOverItem?.(e, todo.id);
        }}
        onDrop={(e: React.DragEvent<HTMLDivElement>) => {
          if (isSelectionMode) return;
          e.preventDefault();
          hapticDragDrop();
          onDropItem?.(todo.id);
        }}
        className={`group relative rounded-2xl border transition-all ${
          isSelected
            ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/25 dark:border-sky-400 dark:bg-sky-950/30'
            : isDragOver
            ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/20 dark:border-indigo-400 dark:bg-indigo-950/30'
            : todo.completed
            ? 'border-zinc-200/50 bg-zinc-50/50 dark:border-zinc-800/40 dark:bg-zinc-900/30'
            : 'border-zinc-200/90 bg-white shadow-xs hover:border-zinc-300/90 dark:border-zinc-800 dark:bg-zinc-900/70 dark:hover:border-zinc-700/80'
        } p-3.5 sm:p-4 ${isSelectionMode ? 'cursor-pointer' : ''}`}
      >
      {isEditing ? (
        /* Edit Mode Form */
        <form onSubmit={handleSaveEdit} className="space-y-3.5">
          <input
            id={`edit-title-${todo.id}`}
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 focus:border-zinc-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            autoFocus
          />

          {/* Notes with Rich Text Toolbar in Edit */}
          <div className="rounded-xl border border-zinc-200 bg-white p-2.5 dark:border-zinc-700 dark:bg-zinc-800">
            <RichTextToolbar
              textareaRef={editDescriptionRef}
              value={editDescription}
              onChange={setEditDescription}
            />
            <textarea
              ref={editDescriptionRef}
              id={`edit-desc-${todo.id}`}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Add details / notes (supports **bold**, *italic*, lists, links)..."
              rows={2}
              className="w-full resize-none bg-transparent pt-1 text-xs text-zinc-800 focus:outline-hidden dark:text-zinc-200"
            />
          </div>

          {/* Category Selector */}
          <div>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
              Category / Tag:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {categories.map((cat) => {
                const isSelected = !isCustomEditCategory && editCategory === cat;
                const catCfg = getCategoryConfig(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setEditCategory(cat);
                      setIsCustomEditCategory(false);
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
                        : `${catCfg.badgeBg} ${catCfg.badgeText} ${catCfg.darkBadgeBg} ${catCfg.darkBadgeText} border`
                    }`}
                  >
                    #{cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Priority Selector in Edit */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-400">Priority:</span>
              {(['low', 'medium', 'high'] as Priority[]).map((p) => {
                const isSelected = editPriority === p;
                const cfg = PRIORITY_CONFIG[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setEditPriority(p)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-current' : cfg.dotColor}`} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            {/* Due Date & Time in Edit */}
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="flex items-center gap-1 bg-zinc-100 px-2 py-1 rounded-lg dark:bg-zinc-800">
                <Calendar className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                <input
                  id={`edit-duedate-${todo.id}`}
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="bg-transparent text-xs text-zinc-800 dark:text-zinc-200 focus:outline-hidden cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-1 bg-zinc-100 px-2 py-1 rounded-lg dark:bg-zinc-800">
                <Clock className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                <input
                  id={`edit-duetime-${todo.id}`}
                  type="time"
                  value={editDueTime}
                  onChange={(e) => setEditDueTime(e.target.value)}
                  className="bg-transparent text-xs text-zinc-800 dark:text-zinc-200 focus:outline-hidden cursor-pointer"
                />
              </div>

              {/* Edit notification toggle */}
              <button
                type="button"
                id={`edit-notify-${todo.id}`}
                onClick={() => setEditNotifyWhenDue(!editNotifyWhenDue)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  editNotifyWhenDue
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700 font-semibold'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
                title={editNotifyWhenDue ? 'Reminder notification active' : 'Enable notification when due'}
              >
                {editNotifyWhenDue ? (
                  <BellRing className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                ) : (
                  <Bell className="h-3 w-3 text-zinc-400" />
                )}
                <span>{editNotifyWhenDue ? 'Notify' : 'No alert'}</span>
              </button>

              {/* Edit Recurrence select */}
              <div className="flex items-center gap-1 bg-zinc-100 px-2 py-1 rounded-lg dark:bg-zinc-800">
                <Repeat className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                <select
                  id={`edit-recurrence-${todo.id}`}
                  value={editRecurrence}
                  onChange={(e) => setEditRecurrence(e.target.value as RecurrenceType)}
                  className="bg-transparent text-xs text-zinc-800 dark:text-zinc-200 focus:outline-hidden cursor-pointer"
                >
                  <option value="none">No Repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              id={`cancel-edit-${todo.id}`}
              onClick={handleCancelEdit}
              className="px-3 py-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id={`save-edit-${todo.id}`}
              className="rounded-xl bg-zinc-900 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition-all cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        /* Normal View */
        <div className="flex items-start justify-between gap-3">
          {/* Selection Checkbox or Drag Handle */}
          {isSelectionMode ? (
            <button
              type="button"
              id={`select-task-${todo.id}`}
              onClick={(e) => {
                e.stopPropagation();
                hapticButtonClick();
                onToggleSelect?.(todo.id);
              }}
              aria-label={isSelected ? 'Deselect task' : 'Select task'}
              title={isSelected ? 'Deselect task' : 'Select task'}
              className="mt-0.5 relative flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-all cursor-pointer -ml-0.5"
            >
              {isSelected ? (
                <CheckSquare className="h-4.5 w-4.5 text-sky-600 dark:text-sky-400" />
              ) : (
                <Square className="h-4.5 w-4.5 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300" />
              )}
            </button>
          ) : (
            <div
              title="Drag or touch to reorder"
              onTouchStart={() => {
                if (isSelectionMode) return;
                onTouchStartItem?.(todo.id);
              }}
              onTouchMove={(e) => {
                if (isSelectionMode) return;
                onTouchMoveItem?.(e);
              }}
              onTouchEnd={() => {
                if (isSelectionMode) return;
                onTouchEndItem?.();
              }}
              className="cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400 -ml-1 mt-0.5 p-1 shrink-0 transition-colors touch-none select-none"
            >
              <GripVertical className="h-4 w-4" />
            </div>
          )}

          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            {/* Custom accessible Checkbox with Confetti / Sparkle effect */}
            <div className="relative mt-0.5 shrink-0">
              <button
                type="button"
                id={`toggle-task-${todo.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(todo.id);
                }}
                aria-label={todo.completed ? 'Mark task pending' : 'Mark task complete'}
                className="relative flex h-5 w-5 items-center justify-center rounded-md border transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 cursor-pointer"
              >
                {todo.completed ? (
                  <motion.div
                    initial={{ scale: 0.5, rotate: -15 }}
                    animate={{ scale: [0.5, 1.25, 1], rotate: 0 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                    className="h-5 w-5 rounded-md bg-zinc-900 text-white flex items-center justify-center dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                  >
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  </motion.div>
                ) : (
                  <div className="h-5 w-5 rounded-md border-2 border-zinc-300 hover:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500 transition-colors" />
                )}
              </button>

              {/* Framer Motion subtle confetti / sparkle burst */}
              <ConfettiSparkles
                active={showSparkles}
                onComplete={() => setShowSparkles(false)}
              />
            </div>

            {/* Task Content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`text-sm font-medium leading-snug break-words transition-all ${
                    todo.completed
                      ? 'text-zinc-400 line-through dark:text-zinc-500'
                      : 'text-zinc-900 dark:text-zinc-100'
                  }`}
                >
                  {todo.title}
                </span>

                {/* Category Tag Badge */}
                {todo.category && (
                  <span
                    id={`task-category-${todo.id}`}
                    className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.2 text-[10px] font-semibold tracking-wide border transition-colors ${categoryMeta.badgeBg} ${categoryMeta.badgeText} ${categoryMeta.darkBadgeBg} ${categoryMeta.darkBadgeText}`}
                  >
                    #{todo.category}
                  </span>
                )}

                {/* Priority Tag */}
                <span
                  id={`task-priority-${todo.id}`}
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.2 text-[10px] font-semibold tracking-wide transition-colors ${priorityMeta.badgeBg} ${priorityMeta.badgeText} ${priorityMeta.darkBadgeBg} ${priorityMeta.darkBadgeText}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${priorityMeta.dotColor}`} />
                  {priorityMeta.label}
                </span>

                {/* Recurring Badge */}
                {todo.recurrence && todo.recurrence !== 'none' && (
                  <span
                    id={`task-recurrence-${todo.id}`}
                    title={`Recurring task: repeats ${todo.recurrence}`}
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.2 text-[10px] font-medium bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200/50 dark:border-sky-800/50"
                  >
                    <Repeat className="h-2.5 w-2.5" />
                    <span className="capitalize">{todo.recurrence}</span>
                  </span>
                )}

                {/* Due Date & Time Indicator */}
                {todo.dueDate && (
                  <span
                    id={`task-duedate-${todo.id}`}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                      todo.completed
                        ? 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800/40 dark:text-zinc-500'
                        : dueInfo.isOverdue
                        ? 'bg-rose-50 border border-rose-200/70 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-300'
                        : dueInfo.isToday
                        ? 'bg-amber-50 border border-amber-200/70 text-amber-700 dark:bg-amber-950/40 dark:border-amber-900/40 dark:text-amber-300'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/70 dark:text-zinc-400'
                    }`}
                  >
                    {dueInfo.isOverdue ? (
                      <AlertCircle className="h-3 w-3 text-rose-500 dark:text-rose-400 shrink-0" />
                    ) : dueInfo.isToday ? (
                      <Clock className="h-3 w-3 text-amber-500 dark:text-amber-400 shrink-0" />
                    ) : (
                      <Calendar className="h-3 w-3 text-zinc-400 shrink-0" />
                    )}
                    <span>{dueInfo.label}</span>
                  </span>
                )}

                {/* Due Date Notification Reminder / Visual Indicator */}
                {todo.notifyWhenDue && !todo.completed && (
                  <span
                    id={`task-notify-badge-${todo.id}`}
                    title={
                      dueInfo.isOverdue || dueInfo.isToday
                        ? 'Notification active: Task due date/time reached!'
                        : 'Notification reminder active when due'
                    }
                    className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide border transition-all ${
                      dueInfo.isOverdue || dueInfo.isToday
                        ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700 animate-pulse'
                        : 'bg-zinc-100/80 text-zinc-500 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700'
                    }`}
                  >
                    {dueInfo.isOverdue || dueInfo.isToday ? (
                      <BellRing className="h-3 w-3 text-amber-600 dark:text-amber-400 animate-bounce" />
                    ) : (
                      <Bell className="h-3 w-3 text-zinc-400 dark:text-zinc-500" />
                    )}
                    <span>{dueInfo.isOverdue ? 'Due Now' : dueInfo.isToday ? 'Due Today' : 'Alert on'}</span>
                  </span>
                )}

                {/* Subtasks Count Badge / Toggle Button */}
                <button
                  type="button"
                  id={`subtasks-toggle-btn-${todo.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    hapticButtonClick();
                    setIsSubtasksOpen((prev) => !prev);
                  }}
                  aria-label="Toggle subtasks checklist"
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide border transition-all cursor-pointer ${
                    (todo.subtasks?.length || 0) > 0
                      ? (todo.subtasks?.filter((s) => s.completed).length === todo.subtasks?.length)
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300'
                      : 'bg-zinc-100/80 text-zinc-500 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700 hover:bg-zinc-200/80'
                  }`}
                >
                  <ListChecks className="h-3 w-3" />
                  <span>
                    {(todo.subtasks?.length || 0) > 0
                      ? `${todo.subtasks?.filter((s) => s.completed).length}/${todo.subtasks?.length} Subtasks`
                      : '+ Subtask'}
                  </span>
                  {isSubtasksOpen ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
                </button>
              </div>

              {/* Optional Rich Text Notes / Description */}
              {todo.description && (
                <RichTextNotesView content={todo.description} isCompleted={todo.completed} />
              )}

              {/* Expandable Sub-tasks Drawer */}
              {isSubtasksOpen && (
                <div 
                  id={`subtasks-panel-${todo.id}`}
                  className="mt-2.5 pt-2 pb-1 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2"
                >
                  {(todo.subtasks?.length || 0) > 0 && (
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span className="font-semibold uppercase tracking-wider text-[10px]">
                        Subtasks ({todo.subtasks?.filter((s) => s.completed).length}/{todo.subtasks?.length})
                      </span>
                      <div className="w-20 sm:w-24 bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              (todo.subtasks?.length || 0) > 0
                                ? ((todo.subtasks?.filter((s) => s.completed).length || 0) / (todo.subtasks?.length || 1)) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* List of subtasks */}
                  {todo.subtasks && todo.subtasks.length > 0 && (
                    <ul className="space-y-1.5">
                      {todo.subtasks.map((st) => (
                        <li
                          key={st.id}
                          className="flex items-center justify-between gap-2 group/sub py-0.5 text-xs text-zinc-700 dark:text-zinc-300"
                        >
                          <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={st.completed}
                              onChange={() => {
                                hapticButtonClick();
                                onToggleSubtask?.(todo.id, st.id);
                              }}
                              className="rounded border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer shrink-0"
                            />
                            <span
                              className={`break-words select-none text-xs ${
                                st.completed ? 'line-through text-zinc-400 dark:text-zinc-500' : ''
                              }`}
                            >
                              {st.title}
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              hapticDelete();
                              onDeleteSubtask?.(todo.id, st.id);
                            }}
                            aria-label={`Delete subtask ${st.title}`}
                            className="opacity-70 sm:opacity-0 group-hover/sub:opacity-100 text-zinc-400 hover:text-rose-500 p-1 transition-opacity cursor-pointer shrink-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Add Subtask Input Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newSubtaskTitle.trim()) return;
                      hapticButtonClick();
                      onAddSubtask?.(todo.id, newSubtaskTitle.trim());
                      setNewSubtaskTitle('');
                    }}
                    className="flex items-center gap-1.5 pt-0.5"
                  >
                    <CornerDownRight className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Add sub-task item..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      className="flex-1 text-xs bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-750 rounded-lg px-2.5 py-1 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={!newSubtaskTitle.trim()}
                      className="px-2 py-1 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-1 shrink-0"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
            <button
              type="button"
              id={`edit-task-btn-${todo.id}`}
              onClick={(e) => {
                e.stopPropagation();
                hapticButtonClick();
                setIsEditing(true);
              }}
              aria-label="Edit task"
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              id={`delete-task-btn-${todo.id}`}
              onClick={(e) => {
                e.stopPropagation();
                hapticDelete();
                onDelete(todo.id);
              }}
              aria-label="Delete task"
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      </div>
    </motion.li>
  );
};
