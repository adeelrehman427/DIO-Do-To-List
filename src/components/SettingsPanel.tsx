import React, { useState, useEffect } from 'react';
import {
  X,
  Headphones,
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
  Music,
  CloudRain,
  Radio,
  Waves,
  Play,
  Pause,
  Bell,
  Check,
  Smartphone,
  Tag,
  Download,
  Upload,
  FileJson,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FocusSoundType,
  FOCUS_SOUND_OPTIONS,
  loadFocusAudioSettings,
  startFocusAudio,
  stopFocusAudio,
  setFocusAudioVolume,
  isFocusAudioPlaying,
} from '../utils/focusAudio';
import { isSoundEnabled, setSoundEnabled, playAddTaskSound } from '../utils/sound';
import {
  isHapticsSupported,
  isHapticsEnabled,
  setHapticsEnabled,
  triggerHaptic,
  hapticButtonClick,
  hapticToggle,
} from '../utils/haptics';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onFocusStateChange?: (isPlaying: boolean, soundType: FocusSoundType) => void;
  onOpenManageCategories?: () => void;
  onExportData?: () => string;
  onImportData?: (jsonData: string, mode: 'replace' | 'merge') => { success: boolean; count: number; error?: string };
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  onFocusStateChange,
  onOpenManageCategories,
  onExportData,
  onImportData,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(() => isFocusAudioPlaying());
  const [soundType, setSoundType] = useState<FocusSoundType>(() => loadFocusAudioSettings().soundType);
  const [volume, setVolume] = useState<number>(() => loadFocusAudioSettings().volume);
  const [uiSoundEnabled, setUiSoundEnabled] = useState<boolean>(() => isSoundEnabled());
  const [hapticsActive, setHapticsActive] = useState<boolean>(() => isHapticsEnabled());
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  // Sync state when opened
  useEffect(() => {
    if (isOpen) {
      const currentPlaying = isFocusAudioPlaying();
      const currentSettings = loadFocusAudioSettings();
      setIsPlaying(currentPlaying);
      setSoundType(currentSettings.soundType);
      setVolume(currentSettings.volume);
      setUiSoundEnabled(isSoundEnabled());
      setHapticsActive(isHapticsEnabled());
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setNotificationPermission(Notification.permission);
      }
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleTogglePlay = () => {
    hapticToggle();
    if (isPlaying) {
      stopFocusAudio();
      setIsPlaying(false);
      onFocusStateChange?.(false, soundType);
    } else {
      const success = startFocusAudio(soundType, volume);
      if (success) {
        setIsPlaying(true);
        onFocusStateChange?.(true, soundType);
      }
    }
  };

  const handleSelectSoundType = (type: FocusSoundType) => {
    hapticButtonClick();
    setSoundType(type);
    if (isPlaying) {
      startFocusAudio(type, volume);
      onFocusStateChange?.(true, type);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setFocusAudioVolume(newVol);
  };

  const handleToggleUiSound = () => {
    hapticToggle();
    const next = !uiSoundEnabled;
    setUiSoundEnabled(next);
    setSoundEnabled(next);
    if (next) playAddTaskSound();
  };

  const handleToggleHaptics = () => {
    const next = !hapticsActive;
    setHapticsActive(next);
    setHapticsEnabled(next);
    if (next) {
      triggerHaptic([30, 40, 50]);
    }
  };

  const handleTestHaptics = () => {
    triggerHaptic([35, 50, 75]);
  };

  const handleRequestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
      } catch {
        // ignore
      }
    }
  };

  const getSoundIcon = (id: FocusSoundType) => {
    switch (id) {
      case 'white_noise':
        return <Waves className="h-4 w-4 text-sky-500" />;
      case 'lofi_beats':
        return <Music className="h-4 w-4 text-purple-500" />;
      case 'gentle_rain':
        return <CloudRain className="h-4 w-4 text-teal-500" />;
      case 'alpha_drone':
        return <Radio className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            id="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl z-10 max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                  <Headphones className="h-5 w-5" />
                </div>
                <div>
                  <h3
                    id="settings-modal-title"
                    className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-none"
                  >
                    Settings & Focus Mode
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Ambient background audio & application preferences
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="close-settings-button"
                onClick={onClose}
                aria-label="Close settings"
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="px-6 py-5 overflow-y-auto space-y-6 flex-1 text-zinc-800 dark:text-zinc-200">
              {/* Focus Audio Feature Card */}
              <div className="rounded-2xl border border-amber-200/80 dark:border-amber-800/40 bg-gradient-to-b from-amber-50/50 to-white dark:from-amber-950/20 dark:to-zinc-900/60 p-4 space-y-4">
                {/* Master Play/Pause Header */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      id="focus-audio-toggle-btn"
                      onClick={handleTogglePlay}
                      aria-label={isPlaying ? 'Pause focus audio' : 'Play focus audio'}
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all shadow-sm cursor-pointer ${
                        isPlaying
                          ? 'bg-amber-500 text-white hover:bg-amber-600 ring-4 ring-amber-500/20'
                          : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5 fill-current" />
                      ) : (
                        <Play className="h-5 w-5 fill-current ml-0.5" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          Focus Mode Audio
                        </span>
                        {isPlaying && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Playing
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Generated live with browser Web Audio API
                      </p>
                    </div>
                  </div>

                  {/* Equalizer Visualizer Bars when active */}
                  {isPlaying && (
                    <div className="flex items-end gap-1 h-6 px-2 py-1">
                      <span className="w-1 bg-amber-500 rounded-full animate-[bounce_0.6s_infinite_100ms] h-4" />
                      <span className="w-1 bg-amber-500 rounded-full animate-[bounce_0.8s_infinite_200ms] h-6" />
                      <span className="w-1 bg-amber-500 rounded-full animate-[bounce_0.5s_infinite_150ms] h-3" />
                      <span className="w-1 bg-amber-500 rounded-full animate-[bounce_0.7s_infinite_50ms] h-5" />
                    </div>
                  )}
                </div>

                {/* Sound Profile Selection Grid */}
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                    Soundscapes & Rhythms
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {FOCUS_SOUND_OPTIONS.map((opt) => {
                      const isSelected = soundType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          id={`sound-profile-${opt.id}`}
                          onClick={() => handleSelectSoundType(opt.id)}
                          className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/10 border-amber-500/60 ring-2 ring-amber-500/20 text-zinc-900 dark:text-zinc-100'
                              : 'bg-white dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/80 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">{getSoundIcon(opt.id)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold truncate">{opt.name}</span>
                              <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                                {opt.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5 leading-snug">
                              {opt.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Volume Slider */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                      {volume === 0 ? (
                        <VolumeX className="h-3.5 w-3.5 text-zinc-400" />
                      ) : (
                        <Volume2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      )}
                      Focus Volume
                    </span>
                    <span className="font-mono text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>
                  <input
                    id="focus-volume-slider"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    aria-label="Focus mode volume"
                    className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>

              {/* General Preferences */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Tactile & Audio Feedback
                </h4>

                {/* Haptic Feedback (Vibration) Toggle */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                  <div className="pr-3">
                    <div className="flex items-center gap-1.5">
                      <Smartphone className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 block">
                        Haptic Feedback (Vibrations)
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 block mt-0.5">
                      Tactile vibrations on completing tasks, dragging & dropping, and button taps
                    </span>
                    {hapticsActive && (
                      <button
                        type="button"
                        id="test-haptics-btn"
                        onClick={handleTestHaptics}
                        className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-200/80 dark:bg-zinc-750 px-2 py-0.5 rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                      >
                        ⚡ Test vibration pulse
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    id="haptics-toggle-btn"
                    onClick={handleToggleHaptics}
                    aria-label={hapticsActive ? 'Disable haptic feedback' : 'Enable haptic feedback'}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                      hapticsActive ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-300 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-zinc-900 transition-transform ${
                        hapticsActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* UI Sound Effects Toggle */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                  <div>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 block">
                      Task Audio Feedback
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Soft acoustic chimes on completing tasks and adding items
                    </span>
                  </div>
                  <button
                    type="button"
                    id="ui-sound-toggle-btn"
                    onClick={handleToggleUiSound}
                    aria-label={uiSoundEnabled ? 'Disable UI sound' : 'Enable UI sound'}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      uiSoundEnabled ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-300 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-zinc-900 transition-transform ${
                        uiSoundEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Task Categories Management Option */}
                {onOpenManageCategories && (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                    <div>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 block">
                        Task Categories
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        Create, rename, or delete custom categories and tags
                      </span>
                    </div>
                    <button
                      type="button"
                      id="settings-manage-categories-btn"
                      onClick={() => {
                        hapticButtonClick();
                        onClose();
                        onOpenManageCategories();
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5 shrink-0"
                    >
                      <Tag className="h-3.5 w-3.5" />
                      <span>Manage</span>
                    </button>
                  </div>
                )}

                {/* Browser Notifications Permission Status */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                  <div>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 block">
                      System Notifications
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Native browser alerts for imminent and overdue deadlines
                    </span>
                  </div>
                  {notificationPermission === 'granted' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <Check className="h-3 w-3" />
                      Active
                    </span>
                  ) : (
                    <button
                      type="button"
                      id="request-notification-btn"
                      onClick={() => {
                        hapticButtonClick();
                        handleRequestNotificationPermission();
                      }}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Enable
                    </button>
                  )}
                </div>

                {/* Data Export / Import (Backup & Restore) */}
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <FileJson className="h-4 w-4 text-sky-500" />
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 block">
                        Data Export & Import (JSON)
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 block mt-0.5">
                      Save a local backup of your tasks and categories, or restore data from a previous file.
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      id="export-data-btn"
                      onClick={() => {
                        hapticButtonClick();
                        if (onExportData) {
                          const jsonStr = onExportData();
                          const blob = new Blob([jsonStr], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `dio-todos-backup-${new Date().toISOString().split('T')[0]}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                          setImportStatus({ type: 'success', message: 'Data backup exported successfully!' });
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export JSON</span>
                    </button>

                    <label
                      htmlFor="import-json-input"
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer inline-flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Import JSON</span>
                      <input
                        id="import-json-input"
                        type="file"
                        accept=".json,application/json"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file || !onImportData) return;
                          hapticButtonClick();
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const text = event.target?.result;
                            if (typeof text === 'string') {
                              const res = onImportData(text, 'merge');
                              if (res.success) {
                                setImportStatus({ type: 'success', message: `Imported ${res.count} tasks successfully!` });
                              } else {
                                setImportStatus({ type: 'error', message: res.error || 'Failed to import JSON file' });
                              }
                            }
                          };
                          reader.readAsText(file);
                          e.target.value = '';
                        }}
                        className="sr-only"
                      />
                    </label>
                  </div>

                  {importStatus && (
                    <p
                      className={`text-xs font-medium ${
                        importStatus.type === 'success'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {importStatus.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-end">
              <button
                type="button"
                id="settings-done-btn"
                onClick={() => {
                  hapticButtonClick();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                Close Settings
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
