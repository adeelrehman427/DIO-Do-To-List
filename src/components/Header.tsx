import React, { useState } from 'react';
import {
  CheckCircle2,
  Moon,
  Sun,
  Palette,
  Volume2,
  VolumeX,
  BellRing,
  Bell,
  Headphones,
  Sliders,
  Timer,
  Keyboard,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { isSoundEnabled, setSoundEnabled, playAddTaskSound } from '../utils/sound';
import { isFocusAudioPlaying, FocusSoundType } from '../utils/focusAudio';
import { hapticButtonClick, hapticToggle } from '../utils/haptics';
import { SettingsPanel } from './SettingsPanel';
import { PomodoroTimer } from './PomodoroTimer';
import { TodoItem, ThemeMode } from '../types';

interface HeaderProps {
  totalCount: number;
  completedCount: number;
  isDark: boolean;
  theme?: ThemeMode;
  onToggleTheme: () => void;
  alertCount?: number;
  onTriggerAlerts?: () => void;
  activeTasks?: TodoItem[];
  onCompleteTask?: (taskId: string) => void;
  onOpenManageCategories?: () => void;
  onExportData?: () => string;
  onImportData?: (jsonData: string, mode: 'replace' | 'merge') => { success: boolean; count: number; error?: string };
  onOpenShortcuts?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalCount,
  completedCount,
  isDark,
  theme = 'light',
  onToggleTheme,
  alertCount = 0,
  onTriggerAlerts,
  activeTasks = [],
  onCompleteTask,
  onOpenManageCategories,
  onExportData,
  onImportData,
  onOpenShortcuts,
}) => {
  const [soundActive, setSoundActive] = useState<boolean>(() => isSoundEnabled());
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPomodoroOpen, setIsPomodoroOpen] = useState<boolean>(false);
  const [isFocusAudioActive, setIsFocusAudioActive] = useState<boolean>(() => isFocusAudioPlaying());

  const handleToggleSound = () => {
    hapticToggle();
    const nextState = !soundActive;
    setSoundActive(nextState);
    setSoundEnabled(nextState);
    if (nextState) {
      playAddTaskSound();
    }
  };

  const handleFocusStateChange = (playing: boolean) => {
    setIsFocusAudioActive(playing);
  };

  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <header className="mb-8 pt-4">
      {/* Settings & Focus Audio Modal */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          setIsFocusAudioActive(isFocusAudioPlaying());
        }}
        onFocusStateChange={handleFocusStateChange}
        onOpenManageCategories={onOpenManageCategories}
        onExportData={onExportData}
        onImportData={onImportData}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Date & Main Heading: Extra prominent, bold and centered on mobile screens */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left min-w-0">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
            <span className="text-base sm:text-xs font-extrabold sm:font-semibold tracking-wider uppercase text-zinc-800 dark:text-zinc-200 sm:text-zinc-500 sm:dark:text-zinc-400">
              {todayFormatted}
            </span>
          </div>
          <h1 
            id="app-title" 
            className="text-3xl sm:text-3xl lg:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 font-display text-center sm:text-left drop-shadow-xs"
          >
            DIO To-Do List
          </h1>
        </div>

        {/* Control Icons: Centered neatly below the title on mobile view */}
        <div 
          id="header-controls-bar"
          className="flex items-center justify-center sm:justify-end flex-wrap gap-2 sm:gap-2.5 w-full sm:w-auto pt-2 sm:pt-0 mx-auto sm:mx-0"
        >
          {/* 1. Pomodoro Focus Timer Toggle Button */}
          <button
            id="header-pomodoro-button"
            type="button"
            onClick={() => {
              hapticButtonClick();
              setIsPomodoroOpen((prev) => !prev);
            }}
            aria-label="Toggle Pomodoro 25-minute focus session timer"
            title={isPomodoroOpen ? 'Hide Pomodoro Focus Timer' : 'Start 25-Minute Pomodoro Focus Timer'}
            className={`group relative flex h-10 items-center justify-center gap-1.5 rounded-xl border px-3 transition-all shadow-xs cursor-pointer ${
              isPomodoroOpen
                ? 'border-rose-400 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400 ring-2 ring-rose-500/20'
                : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100'
            }`}
          >
            <Timer className="h-4 w-4 text-rose-500 dark:text-rose-400" />
            <span className="text-xs font-semibold hidden sm:inline">25m Focus</span>
          </button>

          {/* 2. Headphones (Settings & Focus Mode Audio) */}
          <button
            id="header-settings-button"
            type="button"
            onClick={() => {
              hapticButtonClick();
              setIsSettingsOpen(true);
            }}
            aria-label="Open settings and focus mode background audio"
            title={
              isFocusAudioActive
                ? 'Focus Mode Audio Active (click to adjust settings)'
                : 'Settings & Focus Mode Audio'
            }
            className={`group relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all shadow-xs cursor-pointer ${
              isFocusAudioActive
                ? 'border-amber-400 bg-amber-500/10 text-amber-600 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-300 ring-2 ring-amber-500/20'
                : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100'
            }`}
          >
            <Headphones className={`h-4 w-4 ${isFocusAudioActive ? 'text-amber-600 dark:text-amber-400 animate-pulse' : ''}`} />
            {isFocusAudioActive && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
            )}
          </button>

          {/* 3. Due & Imminent Task Alerts Bell */}
          <button
            id="due-alerts-bell-button"
            type="button"
            onClick={() => {
              hapticButtonClick();
              onTriggerAlerts?.();
            }}
            aria-label={alertCount > 0 ? `${alertCount} tasks are overdue or imminent` : 'Due date notification alerts'}
            title={
              alertCount > 0
                ? `${alertCount} task${alertCount > 1 ? 's are' : ' is'} overdue or due soon (click to view alerts)`
                : 'No overdue or imminent tasks'
            }
            className={`group relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all shadow-xs cursor-pointer ${
              alertCount > 0
                ? 'border-amber-300 bg-amber-50/70 text-amber-700 hover:border-amber-400 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                : 'border-zinc-200 bg-white text-zinc-400 hover:border-zinc-300 hover:text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-300'
            }`}
          >
            {alertCount > 0 ? (
              <BellRing className="h-4 w-4 animate-bounce" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-xs">
                {alertCount}
              </span>
            )}
          </button>

          {/* 4. Sound Effects Toggle (Volume) */}
          <button
            id="sound-toggle-button"
            type="button"
            onClick={handleToggleSound}
            aria-label={soundActive ? 'Mute sound effects' : 'Enable sound effects'}
            title={soundActive ? 'Sound feedback on (click to mute)' : 'Sound feedback muted (click to enable)'}
            className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white p-2 text-zinc-600 shadow-xs transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
          >
            {soundActive ? (
              <Volume2 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            ) : (
              <VolumeX className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
            )}
          </button>

          {/* 5. Theme Toggle (Light, Dark, Custom Blue) */}
          <button
            id="theme-toggle-button"
            type="button"
            onClick={() => {
              hapticToggle();
              onToggleTheme();
            }}
            aria-label={`Theme: ${theme}. Click to switch theme (Light, Dark, Custom Blue)`}
            title={`Current theme: ${theme.toUpperCase()} (click to switch between Light, Dark, and Custom Blue)`}
            className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white p-2 text-zinc-600 shadow-xs transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
          >
            <motion.div
              key={theme}
              initial={{ scale: 0.7, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {theme === 'custom-blue' ? (
                <Palette className="h-5 w-5 text-sky-400" />
              ) : theme === 'dark' ? (
                <Moon className="h-5 w-5 text-amber-300" />
              ) : (
                <Sun className="h-5 w-5 text-amber-500" />
              )}
            </motion.div>
          </button>

          {/* 6. Keyboard Shortcuts Modal Button */}
          <button
            id="header-shortcuts-button"
            type="button"
            onClick={() => {
              hapticButtonClick();
              onOpenShortcuts?.();
            }}
            aria-label="View keyboard shortcuts (Press ?)"
            title="Keyboard Shortcuts cheat sheet (Press ?)"
            className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white p-2 text-zinc-600 shadow-xs transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100 cursor-pointer"
          >
            <Keyboard className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Pomodoro Focus Timer Component */}
      <AnimatePresence>
        {isPomodoroOpen && (
          <PomodoroTimer
            activeTasks={activeTasks}
            onCompleteTask={onCompleteTask}
            onClose={() => setIsPomodoroOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Progress overview */}
      {totalCount > 0 && (
        <div className="mt-6 rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/40">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Progress Overview</span>
            </div>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {completedCount} of {totalCount} completed ({percentage}%)
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <motion.div
              className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}
    </header>
  );
};
