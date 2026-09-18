import React, { useState, useRef } from 'react';
import {
  Calendar,
  Clock,
  Flag,
  Plus,
  AlignLeft,
  X,
  Tag,
  Bell,
  BellRing,
  Settings2,
  Mic,
  MicOff,
  AlertCircle,
  Repeat,
  CheckCircle2,
  ListPlus,
  Sparkles,
} from 'lucide-react';
import { Priority, RecurrenceType, TodoItem } from '../types';
import { PRIORITY_CONFIG, PRESET_CATEGORIES, getCategoryConfig } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { hapticButtonClick } from '../utils/haptics';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { RichTextToolbar } from './RichTextNotes';
import { parseVoiceSubtaskCommand } from '../utils/voiceCommands';
import { playAddTaskSound } from '../utils/sound';

interface TaskInputProps {
  onAddTask: (
    title: string,
    category: string,
    priority: Priority,
    dueDate?: string,
    dueTime?: string,
    description?: string,
    notifyWhenDue?: boolean,
    recurrence?: RecurrenceType
  ) => void;
  categories?: string[];
  onOpenManageCategories?: () => void;
  todos?: TodoItem[];
  onAddSubtask?: (todoId: string, subtaskTitle: string) => void;
}

export const TaskInput: React.FC<TaskInputProps> = ({
  onAddTask,
  categories = PRESET_CATEGORIES,
  onOpenManageCategories,
  todos = [],
  onAddSubtask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Work');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState<string>('');
  const [dueTime, setDueTime] = useState<string>('');
  const [notifyWhenDue, setNotifyWhenDue] = useState<boolean>(false);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [isExpanded, setIsExpanded] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [voiceInterimCommand, setVoiceInterimCommand] = useState<string | null>(null);

  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const todosRef = useRef<TodoItem[]>(todos);
  todosRef.current = todos;

  const {
    isSupported: isSpeechSupported,
    isListening,
    error: speechError,
    startListening,
    stopListening,
    clearError: clearSpeechError,
  } = useSpeechRecognition();

  const baseTitleRef = useRef('');

  // Auto dismiss voice feedback after 6 seconds
  React.useEffect(() => {
    if (voiceFeedback) {
      const timer = setTimeout(() => {
        setVoiceFeedback(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [voiceFeedback]);

  const handleToggleVoiceInput = () => {
    hapticButtonClick();
    clearSpeechError();
    setVoiceFeedback(null);
    setVoiceInterimCommand(null);

    if (isListening) {
      stopListening();
    } else {
      setIsExpanded(true);
      baseTitleRef.current = title ? `${title.trim()} ` : '';
      startListening({
        onInterim: (interim) => {
          // Detect if user is saying an "add subtask to" command
          if (/^\s*add\s+(?:a\s+|new\s+)?sub[- ]?tasks?\s+to\b/i.test(interim)) {
            setVoiceInterimCommand(interim);
          } else {
            setVoiceInterimCommand(null);
            setTitle(`${baseTitleRef.current}${interim}`);
          }
        },
        onFinal: (final) => {
          setVoiceInterimCommand(null);
          const candidateTranscript = final.trim();

          // Test candidate transcript for voice subtask command
          let commandResult = parseVoiceSubtaskCommand(candidateTranscript, todosRef.current);

          // Also test if combined with existing baseTitleRef matches command
          if (!commandResult.isCommand && baseTitleRef.current.trim()) {
            const combined = `${baseTitleRef.current}${candidateTranscript}`.trim();
            const altResult = parseVoiceSubtaskCommand(combined, todosRef.current);
            if (altResult.isCommand) {
              commandResult = altResult;
            }
          }

          if (commandResult.isCommand) {
            stopListening();
            if (commandResult.success && commandResult.targetTodo && commandResult.subtaskTitle) {
              onAddSubtask?.(commandResult.targetTodo.id, commandResult.subtaskTitle);
              playAddTaskSound();
              hapticButtonClick();
              setTitle(''); // Clear so the command phrase doesn't get left in the task input
              setVoiceFeedback({
                type: 'success',
                message: `Added subtask "${commandResult.subtaskTitle}" to "${commandResult.targetTodo.title}"`,
              });
            } else {
              setTitle('');
              setVoiceFeedback({
                type: 'error',
                message: commandResult.errorMessage || `Task "${commandResult.attemptedTaskName}" not found.`,
              });
            }
          } else {
            // Normal speech-to-text task title
            setTitle(`${baseTitleRef.current}${final}`);
          }
        },
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    hapticButtonClick();

    // Check if manually submitted text is an 'add subtask to...' command
    const commandResult = parseVoiceSubtaskCommand(trimmedTitle, todosRef.current);
    if (commandResult.isCommand) {
      if (commandResult.success && commandResult.targetTodo && commandResult.subtaskTitle) {
        onAddSubtask?.(commandResult.targetTodo.id, commandResult.subtaskTitle);
        playAddTaskSound();
        setTitle('');
        setVoiceFeedback({
          type: 'success',
          message: `Added subtask "${commandResult.subtaskTitle}" to "${commandResult.targetTodo.title}"`,
        });
        return;
      } else {
        setVoiceFeedback({
          type: 'error',
          message: commandResult.errorMessage || `Task "${commandResult.attemptedTaskName}" not found.`,
        });
        return;
      }
    }

    const chosenCategory = isCustomCategory
      ? (customCategory.trim() || 'General')
      : category;

    onAddTask(
      trimmedTitle,
      chosenCategory,
      priority,
      dueDate || undefined,
      dueTime || undefined,
      description || undefined,
      notifyWhenDue,
      recurrence
    );

    setTitle('');
    setDescription('');
    setDueDate('');
    setDueTime('');
    setPriority('medium');
    setNotifyWhenDue(false);
    setRecurrence('none');
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const setQuickDate = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    const dateStr = d.toISOString().split('T')[0];
    setDueDate(dateStr);
    if (!dueTime) {
      setDueTime('17:00'); // Default to 5 PM
    }
  };

  return (
    <div className="mb-8">
      <form
        id="new-task-form"
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white p-3.5 sm:p-4 shadow-sm transition-all focus-within:border-zinc-400 focus-within:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80 dark:focus-within:border-zinc-700"
      >
        <div className="flex items-center gap-3">
          <button
            type="submit"
            id="quick-add-submit-btn"
            disabled={!title.trim()}
            aria-label="Add task"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white transition-all hover:bg-zinc-800 disabled:opacity-30 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white cursor-pointer"
          >
            <Plus className="h-5 w-5" />
          </button>

          <input
            id="new-task-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsExpanded(true)}
            placeholder={
              isListening
                ? 'Listening to your voice...'
                : 'Add a new task... (press Enter to save)'
            }
            className="w-full bg-transparent text-base font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />

          {/* Voice-to-Text Input Button */}
          <button
            type="button"
            id="voice-input-btn"
            onClick={handleToggleVoiceInput}
            aria-label={isListening ? 'Stop voice recording' : 'Add task with voice'}
            title={
              !isSpeechSupported
                ? 'Voice input not supported in this browser'
                : isListening
                ? 'Listening... Click to finish speaking'
                : 'Voice input: Speak to add task'
            }
            className={`relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 ring-2 ring-rose-400 animate-pulse'
                : 'text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:text-zinc-200 dark:hover:bg-zinc-800'
            }`}
          >
            {isListening ? (
              <MicOff className="h-4 w-4 stroke-[2.25]" />
            ) : (
              <Mic className="h-4 w-4 stroke-[2]" />
            )}
          </button>

          {!isExpanded && (
            <button
              type="button"
              id="expand-task-options-btn"
              onClick={() => setIsExpanded(true)}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors px-2 py-1 rounded-lg cursor-pointer"
            >
              <Tag className="h-3.5 w-3.5" />
              <span>Details</span>
            </button>
          )}
        </div>

        {/* Active Voice Listening Banner */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="flex flex-col gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs overflow-hidden"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                  </span>
                  <span className="font-semibold truncate">
                    {voiceInterimCommand
                      ? `Voice Command: "${voiceInterimCommand}"`
                      : 'Listening... Speak a task or say "add subtask to [task] [subtask]"'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={stopListening}
                  className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-rose-200/60 dark:bg-rose-900/60 hover:bg-rose-200 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-200 shrink-0 cursor-pointer transition-colors"
                >
                  Done
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-rose-600/80 dark:text-rose-300/80 pl-4.5">
                <Sparkles className="h-3 w-3 shrink-0" />
                <span>Tip: Say <strong>add subtask to [task name] [subtask name]</strong> to append subtasks by voice.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Voice Feedback Banner (Success or Command Error) */}
        <AnimatePresence>
          {voiceFeedback && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs overflow-hidden ${
                voiceFeedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-900/60 text-rose-800 dark:text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {voiceFeedback.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                )}
                <span className="font-medium truncate">{voiceFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setVoiceFeedback(null)}
                className="p-1 hover:opacity-70 cursor-pointer shrink-0"
                aria-label="Dismiss voice notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Speech Error Banner */}
        <AnimatePresence>
          {speechError && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs overflow-hidden"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <span className="truncate">{speechError}</span>
              </div>
              <button
                type="button"
                onClick={clearSpeechError}
                className="text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 p-0.5 cursor-pointer"
                aria-label="Dismiss error"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expandable Options: Category Tags, Due Date & Time, Priority, Notes */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="mt-3.5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80 space-y-3.5"
            >
              {/* Optional description with Rich Text formatting */}
              <div className="space-y-1 rounded-xl bg-zinc-50/70 p-2.5 dark:bg-zinc-800/40 border border-zinc-150/70 dark:border-zinc-800/70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                    <AlignLeft className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-medium">Notes & Description:</span>
                  </div>
                  <RichTextToolbar
                    textareaRef={descriptionRef}
                    value={description}
                    onChange={setDescription}
                  />
                </div>
                <textarea
                  ref={descriptionRef}
                  id="new-task-description-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add formatted details, notes, bullet points, or links..."
                  rows={2}
                  className="w-full resize-none bg-transparent pt-1 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-hidden dark:text-zinc-200 dark:placeholder:text-zinc-500 leading-relaxed font-sans"
                />
              </div>

              {/* Categories/Tags Selector */}
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Category / Tag:
                    </span>
                  </div>

                  {onOpenManageCategories && (
                    <button
                      type="button"
                      id="input-manage-categories-btn"
                      onClick={() => {
                        hapticButtonClick();
                        onOpenManageCategories();
                      }}
                      className="text-[11px] text-sky-600 hover:text-sky-700 dark:text-sky-400 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Settings2 className="h-3 w-3" />
                      <span>Manage Tags</span>
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {categories.map((cat) => {
                    const isSelected = !isCustomCategory && category === cat;
                    const catCfg = getCategoryConfig(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        id={`category-tag-btn-${cat.toLowerCase()}`}
                        onClick={() => {
                          setCategory(cat);
                          setIsCustomCategory(false);
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
                            : `${catCfg.badgeBg} ${catCfg.badgeText} ${catCfg.darkBadgeBg} ${catCfg.darkBadgeText} border hover:opacity-80`
                        }`}
                      >
                        #{cat}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setIsCustomCategory(!isCustomCategory)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isCustomCategory
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'border border-dashed border-zinc-300 text-zinc-500 hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    + Custom Tag
                  </button>

                  {isCustomCategory && (
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter custom tag..."
                      className="rounded-lg border border-zinc-300 bg-white px-2 py-0.5 text-xs text-zinc-800 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 w-32"
                      autoFocus
                    />
                  )}
                </div>
              </div>

              {/* Priority & Due Date / Time Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {/* Priority Selection */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mr-1 flex items-center gap-1">
                    <Flag className="h-3.5 w-3.5" />
                    Priority:
                  </span>
                  {(['low', 'medium', 'high'] as Priority[]).map((p) => {
                    const isSelected = priority === p;
                    const config = PRIORITY_CONFIG[p];
                    return (
                      <button
                        key={p}
                        type="button"
                        id={`priority-select-${p}`}
                        onClick={() => setPriority(p)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-900'
                            : 'bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200/70 dark:bg-zinc-800/60 dark:text-zinc-400 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isSelected ? 'bg-current' : config.dotColor
                          }`}
                        />
                        {config.label}
                      </button>
                    );
                  })}
                </div>

                {/* Due Date & Time Selectors */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Date Input */}
                  <div className="flex items-center gap-1 bg-zinc-100/80 px-2 py-1 rounded-lg dark:bg-zinc-800/60">
                    <Calendar className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                    <input
                      id="new-task-duedate-input"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      aria-label="Due date"
                      className="bg-transparent text-xs font-medium text-zinc-700 focus:outline-hidden dark:text-zinc-300 cursor-pointer"
                    />
                  </div>

                  {/* Time Input */}
                  <div className="flex items-center gap-1 bg-zinc-100/80 px-2 py-1 rounded-lg dark:bg-zinc-800/60">
                    <Clock className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                    <input
                      id="new-task-duetime-input"
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      aria-label="Due time"
                      className="bg-transparent text-xs font-medium text-zinc-700 focus:outline-hidden dark:text-zinc-300 cursor-pointer"
                    />
                  </div>

                  {(dueDate || dueTime) && (
                    <button
                      type="button"
                      onClick={() => {
                        setDueDate('');
                        setDueTime('');
                      }}
                      title="Clear date and time"
                      className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Due Date Notification Reminder Toggle */}
                  <button
                    type="button"
                    id="new-task-notify-toggle-btn"
                    onClick={() => {
                      const next = !notifyWhenDue;
                      setNotifyWhenDue(next);
                      if (next && typeof window !== 'undefined' && 'Notification' in window) {
                        if (Notification.permission === 'default') {
                          Notification.requestPermission().catch(() => {});
                        }
                      }
                    }}
                    aria-label={notifyWhenDue ? 'Reminder notification active' : 'Enable reminder notification when due'}
                    title={notifyWhenDue ? 'Notification reminder enabled (click to disable)' : 'Notify when due date is reached'}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      notifyWhenDue
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700 font-semibold shadow-xs'
                        : 'bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200/80 dark:bg-zinc-800/60 dark:text-zinc-400 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {notifyWhenDue ? (
                      <BellRing className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                    ) : (
                      <Bell className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                    )}
                    <span>{notifyWhenDue ? 'Notify when due' : 'Notify'}</span>
                  </button>

                  {!dueDate && (
                    <div className="hidden sm:flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setQuickDate(0)}
                        className="rounded-md bg-zinc-100/80 px-2 py-0.5 text-[11px] font-medium text-zinc-600 hover:bg-zinc-200/80 dark:bg-zinc-800/60 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickDate(1)}
                        className="rounded-md bg-zinc-100/80 px-2 py-0.5 text-[11px] font-medium text-zinc-600 hover:bg-zinc-200/80 dark:bg-zinc-800/60 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
                      >
                        Tomorrow
                      </button>
                    </div>
                  )}
                </div>

                {/* Recurring Task Option */}
                <div className="flex items-center gap-1.5 pt-1 w-full sm:w-auto">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mr-1 flex items-center gap-1">
                    <Repeat className="h-3.5 w-3.5" />
                    Repeat:
                  </span>
                  {(['none', 'daily', 'weekly'] as RecurrenceType[]).map((r) => {
                    const isSelected = recurrence === r;
                    const labels: Record<RecurrenceType, string> = {
                      none: "Don't Repeat",
                      daily: 'Daily',
                      weekly: 'Weekly',
                    };
                    return (
                      <button
                        key={r}
                        type="button"
                        id={`recurrence-select-${r}`}
                        onClick={() => {
                          hapticButtonClick();
                          setRecurrence(r);
                          if (r !== 'none' && !dueDate) {
                            setQuickDate(0);
                          }
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
                            : 'bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200/70 dark:bg-zinc-800/60 dark:text-zinc-400 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {labels[r]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
};
