import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfettiSparklesProps {
  active: boolean;
  onComplete?: () => void;
}

interface Particle {
  id: number;
  type: 'star' | 'dot' | 'confetti';
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color: string;
  delay: number;
  duration: number;
}

const PALETTE = [
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#0EA5E9', // Sky
  '#8B5CF6', // Violet
  '#F43F5E', // Rose
  '#FBBF24', // Warm Yellow
  '#34D399', // Mint
  '#38BDF8', // Cyan
];

export const ConfettiSparkles: React.FC<ConfettiSparklesProps> = ({ active, onComplete }) => {
  // Generate random particles whenever active becomes true
  const particles: Particle[] = useMemo(() => {
    if (!active) return [];

    const items: Particle[] = [];
    const count = 16;

    for (let i = 0; i < count; i++) {
      // Distribute evenly around a circle with slight random jitter
      const baseAngle = (i / count) * Math.PI * 2;
      const angleJitter = (Math.random() - 0.5) * 0.4;
      const angle = baseAngle + angleJitter;

      // Burst distance (28px to 62px)
      const distance = 28 + Math.random() * 34;

      // Initial trajectory with slight downward gravity bias
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance + (10 + Math.random() * 12);

      const types: Array<'star' | 'dot' | 'confetti'> = ['star', 'dot', 'confetti'];
      const type = types[Math.floor(Math.random() * types.length)];
      const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];

      items.push({
        id: i,
        type,
        x: targetX,
        y: targetY,
        scale: 0.6 + Math.random() * 0.6,
        rotation: (Math.random() - 0.5) * 480,
        color,
        delay: Math.random() * 0.06,
        duration: 0.6 + Math.random() * 0.25,
      });
    }

    return items;
  }, [active]);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {active && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-visible"
        >
          {/* Subtle expanding shockwave halo */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0.8 }}
            animate={{ scale: 2.4, opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="absolute h-6 w-6 rounded-full border border-amber-400/80 bg-amber-400/20"
          />

          {/* Secondary micro ring */}
          <motion.div
            initial={{ scale: 0.2, opacity: 0.9 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.04 }}
            className="absolute h-5 w-5 rounded-full border border-emerald-400/70"
          />

          {/* Radiating Sparkles and Confetti Particles */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                x: 0,
                y: 0,
                scale: 0,
                opacity: 1,
                rotate: 0,
              }}
              animate={{
                x: p.x,
                y: p.y,
                scale: [0, p.scale * 1.25, p.scale, 0],
                opacity: [1, 1, 0.8, 0],
                rotate: p.rotation,
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: [0.22, 1, 0.36, 1], // Gentle spring-like deceleration
              }}
              className="absolute left-1/2 top-1/2 -ml-1 -mt-1 flex items-center justify-center"
            >
              {p.type === 'star' && (
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5 drop-shadow-xs"
                  style={{ fill: p.color }}
                >
                  {/* 4-pointed sparkle star */}
                  <path d="M12 0L14.4 8.6L23 11L14.4 13.4L12 22L9.6 13.4L1 11L9.6 8.6L12 0Z" />
                </svg>
              )}

              {p.type === 'dot' && (
                <span
                  className="h-2 w-2 rounded-full shadow-xs"
                  style={{ backgroundColor: p.color }}
                />
              )}

              {p.type === 'confetti' && (
                <span
                  className="h-2.5 w-1.5 rounded-xs shadow-xs"
                  style={{ backgroundColor: p.color }}
                />
              )}
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};
