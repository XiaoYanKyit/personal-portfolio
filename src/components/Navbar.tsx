import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

export interface NavbarProps {
  activeSceneIndex: number;
  scrollProgress: number;
  onNavigateScene: (sceneId: string) => void;
}

const NAV_ITEMS = [
  { id: 'scene-about', label: 'About', index: 1 },
  { id: 'scene-work', label: 'Selected Work', index: 2 },
  { id: 'scene-capabilities', label: 'Capabilities', index: 3 },
  { id: 'scene-approach', label: 'Approach', index: 4 },
  { id: 'scene-contact', label: 'Contact', index: 5 }
];

export const Navbar: React.FC<NavbarProps> = ({
  activeSceneIndex,
  scrollProgress,
  onNavigateScene
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, sceneId: string) => {
    e.preventDefault();
    soundEngine.playTick(560, 0.025);
    setMobileMenuOpen(false);
    onNavigateScene(sceneId);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-[#07080a]/90 border-b border-white/10">
      {/* Scroll progress indicator hairline */}
      <div className="w-full h-[2px] bg-white/5 overflow-hidden">
        <div
          data-testid="scroll-progress-bar"
          className="h-full bg-[#38bdf8] origin-left transition-transform duration-100"
          style={{ transform: `scaleX(${Math.max(0.02, scrollProgress)})` }}
        />
      </div>

      {/* Strict 3-Zone Top Bar Contract */}
      <div className="max-w-[1380px] mx-auto flex items-center justify-between gap-8 px-6 py-4">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#scene-intro"
          onClick={(e) => handleLinkClick(e, 'scene-intro')}
          className="font-display text-sm sm:text-base font-bold tracking-wider text-[#f4f4f6] hover:text-[#38bdf8] transition-colors whitespace-nowrap shrink-0"
        >
          KHANT NYI NYI THIT
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-xs font-medium tracking-wide text-slate-300"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSceneIndex === item.index;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleLinkClick(e, item.id)}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'border-[#38bdf8] text-[#f4f4f6]'
                    : 'border-transparent text-slate-400 hover:text-[#f4f4f6] hover:border-white/30'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action + Mobile Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.playTick(620, 0.03);
              onNavigateScene('scene-work');
            }}
            className="hidden sm:inline-flex px-4 py-2 text-xs font-semibold tracking-wide text-[#07080a] bg-[#f4f4f6] hover:bg-[#38bdf8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Explore Work
          </button>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 text-slate-300 hover:text-white border border-white/15 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Accessible Drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden bg-[#0a0c10] border-b border-white/15 px-6 py-5 space-y-3"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => handleLinkClick(e, item.id)}
              className="block py-2 text-sm font-medium text-slate-200 hover:text-[#38bdf8] border-b border-white/5"
            >
              0{item.index + 1}. {item.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigateScene('scene-work');
            }}
            className="w-full mt-2 py-2.5 text-xs font-semibold tracking-wider text-[#07080a] bg-[#f4f4f6] hover:bg-[#38bdf8] transition-colors"
          >
            Explore Selected Work
          </button>
        </nav>
      )}
    </header>
  );
};
