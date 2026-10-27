import React, { useEffect, useRef, useState } from 'react';

export interface CustomCursorProps {
  reducedMotion: boolean;
}

export const CustomCursor: React.FC<CustomCursorProps> = ({ reducedMotion }) => {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(pointer: coarse)').matches || reducedMotion) {
      setIsTouch(true);
      return;
    }

    const handleMove = (e: MouseEvent) => {
      setVisible(true);
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
      const target = e.target as HTMLElement | null;
      const isInteractive = Boolean(
        target?.closest('button, a, input, textarea, select, [role="button"]')
      );
      setHovered(isInteractive);
    };

    const handleLeave = () => setVisible(false);

    window.addEventListener('mousemove', handleMove, { passive: true });
    document.addEventListener('mouseleave', handleLeave);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
    };
  }, [reducedMotion]);

  if (isTouch || reducedMotion || !visible) return null;

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className="fixed top-0 left-0 z-50 pointer-events-none hidden lg:block -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out"
    >
      <div
        className={`flex items-center justify-center border transition-transform duration-150 ${
          hovered
            ? 'w-9 h-9 border-[#38bdf8] scale-110 bg-[#38bdf8]/10'
            : 'w-5 h-5 border-white/35 scale-100'
        }`}
      >
        <div className="w-1 h-1 bg-[#38bdf8]" />
      </div>
    </div>
  );
};
