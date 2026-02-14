export interface TweenOptions {
  from: number;
  to: number;
  duration: number;
  easing?: (t: number) => number;
  onUpdate: (value: number) => void;
  onComplete?: () => void;
}

export const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

export const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};

export function tween(options: TweenOptions): () => void {
  const start = performance.now();
  const easing = options.easing ?? easeOutCubic;
  let rafId = 0;

  const frame = (now: number) => {
    const progress = Math.min(1, (now - start) / options.duration);
    const eased = easing(progress);
    const value = options.from + (options.to - options.from) * eased;
    options.onUpdate(value);
    if (progress < 1) {
      rafId = requestAnimationFrame(frame);
    } else {
      options.onComplete?.();
    }
  };

  rafId = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(rafId);
}
