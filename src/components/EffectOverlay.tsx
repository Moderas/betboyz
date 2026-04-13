import type { EffectRecord } from '../types';
import Mascot from './Mascot';

interface Props {
  effects: EffectRecord[];
}

/**
 * Renders full-screen overlay effects (storm, bighead).
 * Multiple effects of the same type can stack.
 */
export default function EffectOverlay({ effects }: Props) {
  const hasStorm = effects.some((e) => e.type === 'storm');
  const hasBigHead = effects.some((e) => e.type === 'bighead');

  if (!hasStorm && !hasBigHead) return null;

  return (
    <>
      {hasStorm && <StormOverlay />}
      {hasBigHead && <BigHeadOverlay />}
    </>
  );
}

function StormOverlay() {
  // 30 emoji raindrop elements staggered across the screen
  const drops = Array.from({ length: 30 }, (_, i) => ({
    left: `${(i / 30) * 100 + Math.random() * (100 / 30)}%`,
    delay: `${(i / 30) * 2}s`,
    duration: `${1.5 + Math.random() * 1.5}s`,
    fontSize: `${1.5 + Math.random() * 1.5}rem`,
  }));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9500,
        overflow: 'hidden',
      }}
    >
      {drops.map((d, i) => (
        <span
          key={i}
          className="storm-drop"
          style={{
            position: 'absolute',
            top: '-3rem',
            left: d.left,
            fontSize: d.fontSize,
            animationDuration: d.duration,
            animationDelay: d.delay,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
          }}
        >
          😭
        </span>
      ))}
    </div>
  );
}

function BigHeadOverlay() {
  const corners = [
    { top: '1rem', left: '1rem' },
    { top: '1rem', right: '1rem' },
    { bottom: '1rem', left: '1rem' },
    { bottom: '1rem', right: '1rem' },
  ] as const;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9400,
      }}
    >
      {corners.map((pos, i) => (
        <div
          key={i}
          className="bighead-mascot"
          style={{
            position: 'absolute',
            ...pos,
            animationDelay: `${i * 0.15}s`,
          }}
        >
          <Mascot size={120} animate={true} />
        </div>
      ))}
    </div>
  );
}
