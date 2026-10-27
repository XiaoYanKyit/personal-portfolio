import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Volume2, VolumeX, Eye, Compass } from 'lucide-react';
import { PORTFOLIO_DATA } from '../data/portfolioData';
import { soundEngine } from '../utils/soundEngine';

export interface ControlDockProps {
  activeSceneIndex: number;
  cameraMode: 'story' | 'inspection';
  reducedMotion: boolean;
  audioEnabled: boolean;
  onNavigateScene: (sceneId: string) => void;
  onToggleCameraMode: () => void;
  onToggleReducedMotion: () => void;
  onToggleAudio: () => void;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  activeSceneIndex,
  cameraMode,
  reducedMotion,
  audioEnabled,
  onNavigateScene,
  onToggleCameraMode,
  onToggleReducedMotion,
  onToggleAudio
}) => {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });

  // Support keyboard shortcut 'H' to collapse/expand HUD dock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'h' || e.key === 'H') {
        setCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <aside
      aria-label="3D Scene and Experience Controls"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 w-auto max-w-[96vw] pointer-events-auto"
    >
      <div className="flex flex-col items-center">
        {/* Collapse / Expand Handle */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playTick(480, 0.02);
            setCollapsed((prev) => !prev);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0b0d13] border border-b-0 border-white/15 font-mono text-[11px] text-slate-300 hover:text-[#38bdf8] transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          {collapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Show Controls</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Hide Controls</span>
            </>
          )}
        </button>

        {/* Main Dock Bar (Single horizontal row, no wrapping stack) */}
        {!collapsed && (
          <div className="flex flex-nowrap items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-[#0b0d13]/95 border border-white/15 shadow-2xl overflow-x-auto max-w-[94vw]">
            {/* Chapter Quick-Jump Buttons */}
            <div className="flex items-center gap-1 shrink-0" role="group" aria-label="Scene Chapters">
              {PORTFOLIO_DATA.scenes.map((scene, idx) => {
                const isActive = activeSceneIndex === idx;
                return (
                  <button
                    key={scene.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playTick(540, 0.025);
                      onNavigateScene(scene.id);
                    }}
                    title={`Jump to ${scene.number}. ${scene.label}`}
                    className={`px-2 py-1 font-mono text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                      isActive
                        ? 'bg-[#38bdf8] text-[#07080a] font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {scene.number}
                  </button>
                );
              })}
            </div>

            <div className="h-4 w-[1px] bg-white/10 shrink-0" />

            {/* 3D Camera Orbit vs Story Mode */}
            <button
              type="button"
              onClick={onToggleCameraMode}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                cameraMode === 'inspection'
                  ? 'border-[#38bdf8] text-[#38bdf8] bg-[#38bdf8]/10'
                  : 'border-white/15 text-slate-300 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{cameraMode === 'inspection' ? 'Camera: Orbit' : 'Camera: Story'}</span>
            </button>

            {/* Audio Toggle (Disabled by default as required) */}
            <button
              type="button"
              onClick={onToggleAudio}
              aria-pressed={audioEnabled}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                audioEnabled
                  ? 'border-[#38bdf8] text-[#38bdf8] bg-[#38bdf8]/10'
                  : 'border-white/15 text-slate-400 hover:text-white'
              }`}
            >
              {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{audioEnabled ? 'Audio: On' : 'Audio: Muted'}</span>
            </button>

            {/* Reduced Motion Toggle */}
            <button
              type="button"
              onClick={onToggleReducedMotion}
              aria-pressed={reducedMotion}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                reducedMotion
                  ? 'border-amber-400 text-amber-300 bg-amber-400/10'
                  : 'border-white/15 text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{reducedMotion ? 'Motion: Reduced' : 'Motion: Full'}</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
