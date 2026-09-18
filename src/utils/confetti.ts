import confetti from 'canvas-confetti';

/**
 * Fires a subtle, tasteful celebration confetti animation.
 * Designed to be celebratory without being visually intrusive or blocking the interface.
 */
export function triggerSubtleConfetti(): void {
  // Respect reduced-motion preferences
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const elegantColors = [
    '#38bdf8', // sky-400
    '#818cf8', // indigo-400
    '#34d399', // emerald-400
    '#fbbf24', // amber-400
    '#f472b6', // pink-400
    '#c084fc', // purple-400
  ];

  // First gentle burst from left-center
  confetti({
    particleCount: 38,
    angle: 60,
    spread: 55,
    origin: { x: 0.2, y: 0.7 },
    colors: elegantColors,
    scalar: 0.85,
    drift: 0,
    ticks: 200,
    gravity: 1.1,
    disableForReducedMotion: true,
  });

  // Balanced counterpart burst from right-center with slight delay
  setTimeout(() => {
    confetti({
      particleCount: 38,
      angle: 120,
      spread: 55,
      origin: { x: 0.8, y: 0.7 },
      colors: elegantColors,
      scalar: 0.85,
      drift: 0,
      ticks: 200,
      gravity: 1.1,
      disableForReducedMotion: true,
    });
  }, 120);
}
