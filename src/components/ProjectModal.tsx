import React, { useEffect } from 'react';
import { X, ArrowUpRight, Layers, CheckCircle2 } from 'lucide-react';
import { PortfolioProject } from '../data/portfolioData';

export interface ProjectModalProps {
  project: PortfolioProject | null;
  onClose: () => void;
  onSelectProject: (projectId: string) => void;
  allProjects: PortfolioProject[];
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  project,
  onClose,
  onSelectProject,
  allProjects
}) => {
  useEffect(() => {
    if (!project) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project, onClose]);

  if (!project) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-project-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0b0d13] border border-white/15 p-5 sm:p-8 text-[#f4f4f6] my-auto">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-slate-400 mb-1.5">
              <span className="text-[#38bdf8]">PROJECT {project.number}</span>
              <span aria-hidden="true">·</span>
              <span>{project.status}</span>
            </div>
            <h2
              id="modal-project-title"
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#f4f4f6]"
            >
              {project.title}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">{project.subtitle}</p>
          </div>

          <button
            type="button"
            aria-label="Close project details"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white border border-white/15 hover:border-[#38bdf8] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Narrative & Capabilities */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h3 className="font-mono text-xs tracking-wider text-slate-400 mb-2">
                OPERATIONAL CONTEXT &amp; OVERVIEW
              </h3>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                {project.extendedOverview}
              </p>
            </div>

            <div>
              <h3 className="font-mono text-xs tracking-wider text-slate-400 mb-3">
                CORE SYSTEM CAPABILITIES
              </h3>
              <ul className="space-y-2.5">
                {project.keyCapabilities.map((cap, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-[#38bdf8] shrink-0 mt-0.5" />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-white/10">
              <h3 className="font-mono text-xs tracking-wider text-slate-400 mb-2">
                TECHNOLOGY STACK
              </h3>
              {/* Unboxed metadata with typographic separators (Zero-Pill Rule) */}
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-xs text-[#38bdf8]">
                {project.technologies.map((tech, idx) => (
                  <React.Fragment key={tech}>
                    <span>{tech}</span>
                    {idx < project.technologies.length - 1 && (
                      <span aria-hidden="true" className="text-slate-600">
                        ·
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="p-4 bg-[#10141d] border border-white/10 text-xs text-slate-400 space-y-1">
              <div className="font-mono text-slate-300">STATUS &amp; GOVERNANCE NOTE</div>
              <p>{project.statusNote}</p>
            </div>
          </div>

          {/* Right Column: 4-Stage Architecture Pipeline */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2 font-mono text-xs tracking-wider text-slate-400">
              <Layers className="w-4 h-4 text-[#38bdf8]" />
              <span>WORKFLOW ARCHITECTURE PIPELINE</span>
            </div>

            <div className="space-y-3">
              {project.architectureFlow.map((step) => (
                <div
                  key={step.stage}
                  className="p-4 bg-[#10141d] border border-white/10 hover:border-white/25 transition-colors"
                >
                  <div className="font-mono text-xs text-[#38bdf8] mb-1">{step.stage}</div>
                  <div className="font-display text-sm font-semibold text-[#f4f4f6]">
                    {step.title}
                  </div>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">{step.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Project Switcher */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-slate-400 mr-2">SWITCH PROJECT:</span>
            {allProjects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectProject(p.id)}
                className={`px-3 py-1.5 font-mono text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  p.id === project.id
                    ? 'bg-[#38bdf8] text-[#07080a] font-semibold'
                    : 'bg-[#121620] text-slate-300 hover:text-white border border-white/10'
                }`}
              >
                {p.number} · {p.title.split(' ')[0]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-[#07080a] bg-[#f4f4f6] hover:bg-[#38bdf8] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>Return to 3D Stage</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
