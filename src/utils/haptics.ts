/**
 * Haptic Feedback Engine using the browser-native navigator.vibrate() API.
 * Provides tactile sensations for mobile and touch-enabled devices.
 */

const STORAGE_KEY_HAPTICS = 'todo_app_haptics_enabled';

export function isHapticsSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    'vibrate' in navigator &&
    typeof navigator.vibrate === 'function'
  );
}

export function isHapticsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_HAPTICS);
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

export function setHapticsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_HAPTICS, enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
}

/**
 * Universal vibrate dispatcher with capability & preference checks.
 */
export function triggerHaptic(pattern: number | number[]): boolean {
  if (!isHapticsEnabled() || !isHapticsSupported()) return false;
  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}

/**
 * Task Completion celebration: a distinct, gratifying rhythmic pulse pattern.
 */
export function hapticTaskComplete(): void {
  triggerHaptic([35, 45, 65]);
}

/**
 * Task Uncompletion / Reopen: soft tactile click.
 */
export function hapticTaskUncomplete(): void {
  triggerHaptic(20);
}

/**
 * Drag Start: tactile acknowledgment of item lift/grab.
 */
export function hapticDragStart(): void {
  triggerHaptic(30);
}

/**
 * Drag Hover / Over Target: subtle micro-tick as dragging passes a new position.
 */
export function hapticDragOver(): void {
  triggerHaptic(12);
}

/**
 * Drag Drop / Item Reordered: affirmative solid landing thud.
 */
export function hapticDragDrop(): void {
  triggerHaptic(35);
}

/**
 * Standard Button / Action Click: subtle, crisp tactile click.
 */
export function hapticButtonClick(): void {
  triggerHaptic(12);
}

/**
 * Destructive / Delete action: warning double-buzz.
 */
export function hapticDelete(): void {
  triggerHaptic([20, 35, 20]);
}

/**
 * Toggle Switch / Mode Shift: medium snappy click.
 */
export function hapticToggle(): void {
  triggerHaptic(16);
}

/**
 * Alert / Overdue reminder notification vibration.
 */
export function hapticAlert(): void {
  triggerHaptic([40, 60, 40]);
}
