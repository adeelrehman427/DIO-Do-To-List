import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Coffee,
  Brain,
  Target,
  X,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { TodoItem } from '../types';
import { playPomodoroCompleteSound } from '../utils/sound';
import { hapticButtonClick, hapticTaskComplete } from '../utils/haptics';
import { recordFocusSession } from '../utils/focusHistory';

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

interface ModeConfig {
  label: string;
  durationSeconds: number;
  colorClass: string;
  strokeColor: string;
  bgGlow: string;
  icon: React.ElementType;
}

const MODES: Record<PomodoroMode, ModeConfig> = {
  focus: {
    label: 'Focus',
    durationSeconds: 25 * 60, // 25 minutes
    colorClass: 'text-rose-500 dark:text-rose-400',
    strokeColor: '#f43f5e',
    bgGlow: 'from-rose-500/10 via-transparent to-transparent',
    icon: Brain,
  },
  shortBreak: {
    label: 'Short Break',
    durationSeconds: 5 * 60, // 5 minutes
    colorClass: 'text-emerald-500 dark:text-emerald-400',
    strokeColor: '#10b981',
    bgGlow: 'from-emerald-500/10 via-transparent to-transparent',
    icon: Coffee,
  },
  longBreak: {
    label: 'Long Break',
    durationSeconds: 15 * 60, // 15 minutes
    colorClass: 'text-indigo-500 dark:text-indigo-400',
    strokeColor: '#6366f1',
    bgGlow: 'from-indigo-500/10 via-transparent to-transparent',
    icon: Sparkles,
  },
};

const STORAGE_KEY_SESSIONS = 'dio_pomodoro_completed_sessions';

interface PomodoroTimerProps {
  activeTasks?: TodoItem[];
  onCompleteTask?: (taskId: string) => void;
  onClose?: () => void;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  activeTasks = [],
  onCompleteTask,
  onClose,
}) => {
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(MODES.focus.durationSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(() => {
    return activeTasks.length > 0 ? activeTasks[0].id : '';
  });
  const [completedSessions, setCompletedSessions] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SESSIONS);
      return stored ? parseInt(stored, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const totalDuration = MODES[mode].durationSeconds;
  const timerRef = useRef<number | null>(null);
  const endTimeRef = useRef<number | null>(null);

  // Sync selected task if previous one completed or became invalid
  useEffect(() => {
    if (activeTasks.length > 0) {
      if (!selectedTaskId || !activeTasks.some((t) => t.id === selectedTaskId)) {
        setSelectedTaskId(activeTasks[0].id);
      }
    } else {
      setSelectedTaskId('');
    }
  }, [activeTasks, selectedTaskId]);

  // Request notification permission once if user interacts
  const requestNotifyPermission = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  };

  // Timer Tick Logic with timestamp drift compensation
  useEffect(() => {
    if (isRunning) {
      endTimeRef.current = Date.now() + timeLeft * 1000;

      timerRef.current = window.setInterval(() => {
        if (!endTimeRef.current) return;
        const remainingMs = endTimeRef.current - Date.now();
        const secondsRemaining = Math.max(0, Math.ceil(remainingMs / 1000));

        setTimeLeft(secondsRemaining);

        if (secondsRemaining <= 0) {
          clearInterval(timerRef.current!);
          setIsRunning(false);
          handleSessionComplete();
        }
      }, 500);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  // Completion Handler
  const handleSessionComplete = () => {
    playPomodoroCompleteSound();
    hapticTaskComplete();

    // Trigger native browser notification
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        const title =
          mode === 'focus'
            ? '🎉 Focus Session Completed!'
            : '⏰ Break Over!';
        const body =
          mode === 'focus'
            ? 'Great job staying focused on your active tasks. Time for a well-deserved break!'
            : 'Ready to dive back into your tasks? Start your next focus session!';
        try {
          new Notification(title, { body, icon: '/favicon.ico' });
        } catch {
          // ignore notification frame restriction
        }
      }
    }

    if (mode === 'focus') {
      recordFocusSession(25, currentTask?.title);
      const nextCount = completedSessions + 1;
      setCompletedSessions(nextCount);
      try {
        localStorage.setItem(STORAGE_KEY_SESSIONS, nextCount.toString());
      } catch {
        // ignore
      }

      // Auto-suggest break: long break every 4 sessions, otherwise short break
      const nextMode = nextCount % 4 === 0 ? 'longBreak' : 'shortBreak';
      setMode(nextMode);
      setTimeLeft(MODES[nextMode].durationSeconds);
    } else {
      // Break complete -> back to focus
      setMode('focus');
      setTimeLeft(MODES.focus.durationSeconds);
    }
  };

  const handleTogglePlay = () => {
    hapticButtonClick();
    requestNotifyPermission();
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    hapticButtonClick();
    setIsRunning(false);
    setTimeLeft(MODES[mode].durationSeconds);
  };

  const handleModeChange = (newMode: PomodoroMode) => {
    hapticButtonClick();
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODES[newMode].durationSeconds);
  };

  // SVG Progress Circle Calculations
  const radius = 64;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius; // ~402.12
  const progressRatio = totalDuration > 0 ? timeLeft / totalDuration : 0;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const currentTask = activeTasks.find((t) => t.id === selectedTaskId);
  const currentConfig = MODES[mode];
  const ModeIcon = currentConfig.icon;

  return (
    <motion.div
      id="pomodoro-timer-card"
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      className={`relative mt-4 overflow-hidden rounded-2xl border border-zinc-200/90 bg-white/95 p-4 sm:p-5 shadow-lg backdrop-blur-md dark:border-zinc-800/90 dark:bg-zinc-900/95 bg-gradient-to-br ${currentConfig.bgGlow}`}
    >
      {/* Top Bar: Mode Selectors & Close Button */}
      <div className="flex items-center justify-between gap-2 mb-4">
        {/* Mode Navigation Pills */}
        <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/90">
          {(['focus', 'shortBreak', 'longBreak'] as PomodoroMode[]).map((m) => {
            const config = MODES[m];
            const isSelected = mode === m;
            const Icon = config.icon;
            return (
              <button
                key={m}
                type="button"
                id={`pomodoro-mode-${m}-btn`}
                onClick={() => handleModeChange(m)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-50'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sessions Completed Badge & Close Button */}
        <div className="flex items-center gap-2">
          <span
            id="pomodoro-streak-badge"
            title="Completed focus sessions today"
            className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40"
          >
            🍅 {completedSessions} {completedSessions === 1 ? 'session' : 'sessions'}
          </span>

          {onClose && (
            <button
              type="button"
              id="pomodoro-close-btn"
              onClick={() => {
                hapticButtonClick();
                onClose();
              }}
              aria-label="Hide Pomodoro timer"
              className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Body: Progress Circle + Controls + Active Task Target */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6">
        {/* Left / Center: SVG Radial Progress Circle */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="h-40 w-40 -rotate-90 transform" viewBox="0 0 160 160">
            {/* Background Track Circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
              className="text-zinc-200/80 dark:text-zinc-800/80"
            />
            {/* Animated Progress Indicator Circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke={currentConfig.strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-[stroke-dashoffset] duration-500 ease-linear"
            />
          </svg>

          {/* Centered Time & Status Readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span
              id="pomodoro-time-display"
              className="font-mono text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 tabular-nums"
            >
              {formattedTime}
            </span>
            <div className="flex items-center gap-1 mt-0.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              <span className={`h-1.5 w-1.5 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
              <span>{isRunning ? 'In Progress' : 'Paused'}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Primary Controls & Active Task Focus Indicator */}
        <div className="flex-1 w-full flex flex-col justify-center gap-3.5">
          {/* Active Task Target Indicator */}
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-3 dark:border-zinc-800/80 dark:bg-zinc-800/50">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <Target className="h-3.5 w-3.5 text-rose-500" />
                <span>Focusing On Task</span>
              </span>
              {activeTasks.length > 1 && (
                <span className="text-[10px] text-zinc-400">
                  {activeTasks.length} pending
                </span>
              )}
            </div>

            {activeTasks.length > 0 ? (
              <div className="flex items-center justify-between gap-2">
                {activeTasks.length > 1 ? (
                  <div className="relative flex-1">
                    <select
                      id="pomodoro-task-select"
                      value={selectedTaskId}
                      onChange={(e) => {
                        hapticButtonClick();
                        setSelectedTaskId(e.target.value);
                      }}
                      className="w-full appearance-none rounded-lg border border-zinc-200 bg-white py-1 pl-2 pr-7 text-xs font-medium text-zinc-800 shadow-2xs hover:border-zinc-300 focus:border-rose-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 cursor-pointer truncate"
                    >
                      {activeTasks.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.title} {task.category ? `(#${task.category})` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate flex-1">
                    {currentTask?.title || 'Active task'}
                  </span>
                )}

                {/* Quick Checkoff Button directly from Pomodoro */}
                {currentTask && onCompleteTask && (
                  <button
                    type="button"
                    id="pomodoro-complete-task-btn"
                    onClick={() => {
                      hapticTaskComplete();
                      onCompleteTask(currentTask.id);
                    }}
                    title="Mark active focus task as completed"
                    className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Done</span>
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                No active pending tasks. Focus session is ready for any work!
              </p>
            )}
          </div>

          {/* Action Buttons: Play/Pause and Reset */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="pomodoro-toggle-btn"
              onClick={handleTogglePlay}
              className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer ${
                isRunning
                  ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20'
                  : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-zinc-900/20'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4 fill-current" />
                  <span>Pause Focus</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current ml-0.5" />
                  <span>Start 25-Min Focus</span>
                </>
              )}
            </button>

            <button
              type="button"
              id="pomodoro-reset-btn"
              onClick={handleReset}
              title="Reset timer to beginning"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
