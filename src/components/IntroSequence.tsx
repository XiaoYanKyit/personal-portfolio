import React, { useEffect, useState } from 'react';
import { PORTFOLIO_DATA } from '../data/portfolioData';

export interface IntroSequenceProps {
  visible: boolean;
  onComplete: () => void;
}

export const IntroSequence: React.FC<IntroSequenceProps> = ({ visible, onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!visible) return;

    const start = performance.now();
    const duration = 2200; // 2.2 seconds as specified (2-3s cinematic introduction)
    let rafId = 0;

    const step = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (elapsed < duration) {
        rafId = requestAnimationFrame(step);
      } else {
        onComplete();
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [visible, onComplete]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Portfolio Introduction Sequence"
      className="fixed inset-0 z-50 flex flex-col justify-between bg-[#07080a] p-6 md:p-12 text-[#f4f4f6] transition-opacity duration-500"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <span className="font-mono text-xs tracking-widest text-slate-400">
          PORTFOLIO EDITION · 2026
        </span>
        <button
          type="button"
          onClick={onComplete}
          className="px-4 py-2 text-xs font-medium tracking-wider text-[#f4f4f6] border border-white/20 hover:border-[#38bdf8] hover:text-[#38bdf8] transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          Skip Intro
        </button>
      </div>

      {/* Center Architectural Reveal */}
      <div className="my-auto max-w-4xl">
        <p className="font-mono text-xs tracking-[0.22em] text-[#38bdf8] mb-4">
          {PORTFOLIO_DATA.profile.role}
        </p>
        <h2 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#f4f4f6] leading-[0.96]">
          {PORTFOLIO_DATA.profile.firstName}{' '}
          <span className="text-slate-400">{PORTFOLIO_DATA.profile.lastName}</span>
        </h2>
        <p className="mt-6 max-w-xl text-sm sm:text-base text-slate-400 leading-relaxed">
          {PORTFOLIO_DATA.profile.heroStatement}
        </p>
      </div>

      {/* Bottom Progress Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between font-mono text-xs text-slate-400 tabular-nums">
          <span>INITIALIZING SPATIAL ARCHITECTURE</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-[2px] bg-white/10 overflow-hidden">
          <div
            className="h-full bg-[#38bdf8] transition-transform duration-75 origin-left"
            style={{ transform: `scaleX(${progress / 100})` }}
          />
        </div>
      </div>
    </div>
  );
};
