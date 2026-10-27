/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Copy,
  Layers,
  Send,
  SlidersHorizontal,
  Terminal
} from 'lucide-react';
import { PORTFOLIO_DATA, PortfolioProject } from './data/portfolioData';
import {
  clamp01,
  evaluateIntroSkip,
  filterProjectsByCategory,
  getCapabilityNetworkState,
  getSceneIndexFromProgress,
  InquiryFormInput,
  validateInquiryForm
} from './utils/portfolioLogic';
import { soundEngine } from './utils/soundEngine';
import { ThreeStage } from './components/ThreeStage';
import { IntroSequence } from './components/IntroSequence';
import { Navbar } from './components/Navbar';
import { CustomCursor } from './components/CustomCursor';
import { ProjectModal } from './components/ProjectModal';
import { ControlDock } from './components/ControlDock';

gsap.registerPlugin(ScrollTrigger);

const STACK_FILTERS = [
  { label: 'All Projects', value: 'ALL' },
  { label: 'Python & Django', value: 'Django' },
  { label: 'SQL', value: 'SQL' },
  { label: 'Kotlin', value: 'Kotlin' },
  { label: 'openpyxl', value: 'openpyxl' }
];

const OPERATIONAL_DOMAINS = [
  {
    id: 'enterprise-ops',
    index: '01',
    title: 'Enterprise Business Systems',
    focus: 'SAP / PHM Operational Support & Master Data Alignment',
    detail:
      'Supporting real operational workflows where transaction accuracy, master data consistency, and clear exception handling keep daily business operations moving.'
  },
  {
    id: 'web-apps',
    index: '02',
    title: 'Web Application Development',
    focus: 'Python, Django, React, TypeScript & REST APIs',
    detail:
      'Building internal operations tools, mobile-connected backends, and interactive web applications tailored to practical team needs.'
  },
  {
    id: 'data-automation',
    index: '03',
    title: 'Structured Data & Automation',
    focus: 'SQL Server, SQLite & Python openpyxl Pipelines',
    detail:
      'Replacing repetitive manual spreadsheet editing with validated relational schemas and automated Excel generation.'
  }
];

export default function App() {
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const [showIntro, setShowIntro] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let seenInSession = false;

    try {
      seenInSession = sessionStorage.getItem('knnt_intro_seen') === '1';
    } catch {
      seenInSession = false;
    }

    return !evaluateIntroSkip({
      searchParamsString: window.location.search,
      prefersReducedMotion: prefersReduced,
      hasSeenInSession: seenInSession
    });
  });

  const [scrollProgress, setScrollProgress] = useState(0);

  const [activeProjectId, setActiveProjectId] = useState<string>(
    PORTFOLIO_DATA.projects[0].id
  );

  const [modalProject, setModalProject] =
    useState<PortfolioProject | null>(null);

  const [projectFilter, setProjectFilter] = useState<string>('ALL');

  const [activeCapabilityId, setActiveCapabilityId] = useState<string>(
    PORTFOLIO_DATA.capabilities[0].id
  );

  const [activeDomainId, setActiveDomainId] = useState<string>(
    OPERATIONAL_DOMAINS[0].id
  );

  const [cameraMode, setCameraMode] = useState<'story' | 'inspection'>(
    'story'
  );

  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);

  const [copiedChannelId, setCopiedChannelId] = useState<string | null>(
    null
  );

  // Contact inquiry form state
  const [inquiryForm, setInquiryForm] = useState<InquiryFormInput>({
    name: '',
    email: '',
    topic: 'SAP / Operational Workflow Tool',
    message: ''
  });

  const [inquiryErrors, setInquiryErrors] = useState<
    Partial<Record<keyof InquiryFormInput, string>>
  >({});

  const [inquiryStatus, setInquiryStatus] = useState<string>('');

  const mainContainerRef = useRef<HTMLDivElement | null>(null);

  const activeSceneIndex = useMemo(
    () =>
      getSceneIndexFromProgress(
        scrollProgress,
        PORTFOLIO_DATA.scenes.length
      ),
    [scrollProgress]
  );

  const filteredProjects = useMemo(
    () =>
      filterProjectsByCategory(
        projectFilter,
        PORTFOLIO_DATA.projects
      ),
    [projectFilter]
  );

  const capabilityNetwork = useMemo(
    () => getCapabilityNetworkState(activeCapabilityId),
    [activeCapabilityId]
  );

  const active3DProject = useMemo(
    () =>
      PORTFOLIO_DATA.projects.find(
        (project) => project.id === activeProjectId
      ) || PORTFOLIO_DATA.projects[0],
    [activeProjectId]
  );

  // Sync scroll progress & GSAP section entrance choreography
  useEffect(() => {
    const handleScroll = () => {
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      const ratio =
        docHeight > 0 ? clamp01(window.scrollY / docHeight) : 0;

      setScrollProgress(ratio);
    };

    window.addEventListener('scroll', handleScroll, {
      passive: true
    });

    handleScroll();

    const ctx = gsap.context(() => {
      if (reducedMotion) return;

      const sections = gsap.utils.toArray<HTMLElement>(
        '.cinematic-section'
      );

      sections.forEach((section) => {
        const revealBlocks = section.querySelectorAll('.gsap-reveal');

        if (revealBlocks.length > 0) {
          gsap.fromTo(
            revealBlocks,
            {
              y: 28,
              opacity: 0.15
            },
            {
              y: 0,
              opacity: 1,
              duration: 0.75,
              stagger: 0.08,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: section,
                start: 'top 82%',
                toggleActions: 'play none none none'
              }
            }
          );
        }
      });
    }, mainContainerRef);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      ctx.revert();
    };
  }, [reducedMotion]);

  const handleCompleteIntro = () => {
    try {
      sessionStorage.setItem('knnt_intro_seen', '1');
    } catch {
      // Ignore storage restrictions
    }

    setShowIntro(false);
  };

  const handleNavigateScene = (sceneId: string) => {
    const target = document.getElementById(sceneId);

    if (target) {
      target.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth'
      });
    }
  };

  const handleCopyContact = (id: string, value: string) => {
    soundEngine.playTick(640, 0.03);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).catch(() => {});
    }

    setCopiedChannelId(id);

    window.setTimeout(() => {
      setCopiedChannelId((prev) => (prev === id ? null : prev));
    }, 2200);
  };

  // Validate the form and prepare an email for the visitor to send.
  const handleInquirySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validation = validateInquiryForm(inquiryForm);

    if (!validation.valid) {
      setInquiryErrors(validation.errors);
      setInquiryStatus('');
      soundEngine.playTick(220, 0.05);
      return;
    }

    setInquiryErrors({});
    soundEngine.playPortalOpen();

    const recipient = 'knnt1792000@gmail.com';

    const subject = `[Portfolio Inquiry] ${inquiryForm.topic}`;

    const body = [
      `Name: ${inquiryForm.name}`,
      `Email: ${inquiryForm.email}`,
      `Topic: ${inquiryForm.topic}`,
      '',
      'Message:',
      inquiryForm.message
    ].join('\n');

    const mailtoUrl =
      `mailto:${recipient}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    setInquiryStatus(
      'Your email app should open with the message prepared. Review the message and press Send to deliver your inquiry.'
    );

    window.location.href = mailtoUrl;
  };

  return (
    <div
      ref={mainContainerRef}
      data-scene-index={activeSceneIndex}
      data-active-project={activeProjectId}
      className="relative min-h-screen text-[#f4f4f6] selection:bg-[#38bdf8]/25"
    >
      {/* Desktop Precision Cursor */}
      <CustomCursor reducedMotion={reducedMotion} />

      {/* Initial 2.2s Cinematic Introduction with Skip Option */}
      <IntroSequence
        visible={showIntro}
        onComplete={handleCompleteIntro}
      />

      {/* Top Navigation Bar */}
      <Navbar
        activeSceneIndex={activeSceneIndex}
        scrollProgress={scrollProgress}
        onNavigateScene={handleNavigateScene}
      />

      {/* Real-Time 3D Architectural Environment */}
      <ThreeStage
        scrollProgress={scrollProgress}
        activeProjectId={activeProjectId}
        activeCapabilityId={activeCapabilityId}
        reducedMotion={reducedMotion}
        cameraMode={cameraMode}
      />

      {/* Foreground Semantic Storytelling Layer */}
      <main className="relative z-10 pt-20 pb-28">
        {/* ================================================================
            SCENE 01 — INTRODUCTION (HERO)
        ================================================================= */}
        <section
          id="scene-intro"
          aria-label="01. Introduction"
          className="cinematic-section min-h-[calc(100vh-5rem)] flex flex-col justify-between max-w-[1380px] mx-auto px-6 py-12 md:py-20"
        >
          {/* Scene Index Header */}
          <div className="gsap-reveal flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3 font-mono text-xs text-slate-400">
              <span className="text-[#38bdf8]">SCENE 01 / 06</span>
              <span aria-hidden="true">·</span>
              <span>ARCHITECTURAL PORTAL</span>
            </div>

            <div className="font-mono text-xs text-slate-400">
              {PORTFOLIO_DATA.profile.locationLabel}
            </div>
          </div>

          {/* Center Oversized Editorial Typography */}
          <div className="my-auto py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8 space-y-6">
              <p className="gsap-reveal font-mono text-xs sm:text-sm tracking-[0.22em] text-[#38bdf8] font-medium">
                {PORTFOLIO_DATA.profile.role}
              </p>

              <h1 className="gsap-reveal font-display text-5xl sm:text-7xl lg:text-[5.5rem] font-bold tracking-tight leading-[0.94] text-[#f4f4f6]">
                <span className="block">
                  {PORTFOLIO_DATA.profile.firstName}
                </span>
                <span className="block text-slate-300">
                  {PORTFOLIO_DATA.profile.lastName}
                </span>
              </h1>

              <p className="gsap-reveal max-w-2xl text-base sm:text-xl text-slate-200 leading-relaxed font-normal text-balance">
                “{PORTFOLIO_DATA.profile.heroStatement}”
              </p>

              {/* Primary Actions */}
              <div className="gsap-reveal pt-2 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playPortalOpen();
                    handleNavigateScene('scene-work');
                  }}
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 text-xs sm:text-sm font-semibold tracking-wider text-[#07080a] bg-[#f4f4f6] hover:bg-[#38bdf8] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>EXPLORE MY WORK</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playTick(520, 0.03);
                    handleNavigateScene('scene-about');
                  }}
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 text-xs sm:text-sm font-semibold tracking-wider text-[#f4f4f6] bg-[#0b0d13]/85 border border-white/25 hover:border-[#38bdf8] hover:text-[#38bdf8] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>ABOUT ME</span>
                </button>
              </div>
            </div>

            {/* Right Column: Live Spatial Telemetry */}
            <div className="lg:col-span-4 gsap-reveal bg-[#0b0d13]/85 border border-white/15 p-6 space-y-4">
              <div className="font-mono text-xs text-[#38bdf8] tracking-wider">
                ARCHITECTURAL FOCUS
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Bridging enterprise SAP / PHM operational workflows with
                structured Python, Django, SQL, and modern web applications.
              </p>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between font-mono text-xs text-slate-400">
                <span>5 GROUNDED PROJECTS</span>
                <span aria-hidden="true">·</span>
                <span>8 CORE CAPABILITIES</span>
              </div>
            </div>
          </div>

          {/* Animated Scroll Indicator */}
          <div className="gsap-reveal flex items-center justify-between border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={() => handleNavigateScene('scene-about')}
              className="group inline-flex items-center gap-3 font-mono text-xs tracking-wider text-slate-300 hover:text-[#38bdf8] transition-colors cursor-pointer"
            >
              <span>SCROLL TO ENTER CORRIDOR</span>
              <ArrowDown className="w-4 h-4 text-[#38bdf8] group-hover:translate-y-1 transition-transform" />
            </button>

            <span className="font-mono text-xs text-slate-400 tabular-nums">
              DEPTH {Math.round(scrollProgress * 100)}%
            </span>
          </div>
        </section>

        {/* ================================================================
            SCENE 02 — ABOUT
        ================================================================= */}
        <section
          id="scene-about"
          aria-label="02. About"
          className="cinematic-section max-w-[1380px] mx-auto px-6 py-24 md:py-32 border-t border-white/10"
        >
          <div className="gsap-reveal flex items-center gap-3 font-mono text-xs text-slate-400 mb-6">
            <span className="text-[#38bdf8]">02. ABOUT</span>
            <span aria-hidden="true">·</span>
            <span>OPERATIONAL ARCHITECTURE &amp; PURPOSE</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-6">
              <h2 className="gsap-reveal font-display text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#f4f4f6] text-balance leading-[1.05]">
                “{PORTFOLIO_DATA.profile.aboutHeadline}”
              </h2>

              <p className="gsap-reveal text-lg sm:text-xl text-slate-200 font-medium leading-relaxed">
                {PORTFOLIO_DATA.profile.aboutLead}
              </p>

              <div className="space-y-4 pt-2">
                {PORTFOLIO_DATA.profile.aboutParagraphs.map(
                  (paragraph, index) => (
                    <p
                      key={index}
                      className="gsap-reveal text-sm sm:text-base text-slate-300 leading-relaxed"
                    >
                      {paragraph}
                    </p>
                  )
                )}
              </div>
            </div>

            {/* Right Column: Interactive Domain Cards */}
            <div className="lg:col-span-5 space-y-4">
              <div className="font-mono text-xs tracking-wider text-slate-400 mb-2">
                INTERACTIVE DOMAIN INTERSECTION — SELECT TO INSPECT
              </div>

              {OPERATIONAL_DOMAINS.map((domain) => {
                const isSelected = activeDomainId === domain.id;

                return (
                  <button
                    key={domain.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playTick(500, 0.025);
                      setActiveDomainId(domain.id);
                    }}
                    className={`w-full text-left p-6 border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#101520]/95 border-[#38bdf8]'
                        : 'bg-[#0b0d13]/85 border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-xs text-slate-400 mb-1.5">
                      <span
                        className={
                          isSelected ? 'text-[#38bdf8]' : 'text-slate-400'
                        }
                      >
                        DOMAIN {domain.index}
                      </span>
                      <span>{isSelected ? 'ACTIVE FOCUS' : 'INSPECT'}</span>
                    </div>

                    <h3 className="font-display text-lg sm:text-xl font-bold text-[#f4f4f6]">
                      {domain.title}
                    </h3>

                    <div className="mt-1 font-mono text-xs text-[#38bdf8]">
                      {domain.focus}
                    </div>

                    <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {domain.detail}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================================
            SCENE 03 — SELECTED WORK
        ================================================================= */}
        <section
          id="scene-work"
          aria-label="03. Selected Work"
          className="cinematic-section max-w-[1380px] mx-auto px-6 py-24 md:py-32 border-t border-white/10"
        >
          {/* Section Header & Technology Filters */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
            <div>
              <div className="gsap-reveal flex items-center gap-3 font-mono text-xs text-slate-400 mb-3">
                <span className="text-[#38bdf8]">03. SELECTED WORK</span>
                <span aria-hidden="true">·</span>
                <span>SPATIAL PROJECT PORTALS</span>
              </div>

              <h2 className="gsap-reveal font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#f4f4f6] text-balance">
                Operational Systems &amp; Web Applications
              </h2>
            </div>

            {/* Technology Filter Controls */}
            <div
              role="group"
              aria-label="Filter projects by technology"
              className="gsap-reveal flex flex-wrap items-center gap-1.5 p-1.5 bg-[#0b0d13] border border-white/15"
            >
              {STACK_FILTERS.map((filter) => {
                const active = projectFilter === filter.value;

                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => {
                      soundEngine.playTick(540, 0.025);
                      setProjectFilter(filter.value);
                    }}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#38bdf8] text-[#07080a] font-semibold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active 3D Project Banner */}
          <div className="mb-10 p-5 bg-[#0b0d13]/90 border border-[#38bdf8]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-mono text-xs text-[#38bdf8]">
                <Layers className="w-4 h-4" />
                <span>
                  ACTIVE 3D DIORAMA STAGE: PROJECT {active3DProject.number}
                </span>
              </div>

              <div className="font-display text-base sm:text-lg font-semibold text-[#f4f4f6]">
                {active3DProject.title} —{' '}
                <span className="text-slate-400 font-normal">
                  {active3DProject.visualDirection}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playPortalOpen();
                setModalProject(active3DProject);
              }}
              className="px-4 py-2 text-xs font-semibold text-[#07080a] bg-[#38bdf8] hover:bg-[#f4f4f6] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Open Active Case Study
            </button>
          </div>

          {/* Project Compositions */}
          <div className="space-y-8">
            {filteredProjects.map((project) => {
              const isStageActive = activeProjectId === project.id;

              return (
                <article
                  key={project.id}
                  id={`project-${project.number}`}
                  onMouseEnter={() => setActiveProjectId(project.id)}
                  className={`gsap-reveal group relative bg-[#0b0d13]/90 border transition-colors p-6 sm:p-10 ${
                    isStageActive
                      ? 'border-[#38bdf8]'
                      : 'border-white/12 hover:border-white/30'
                  }`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Project Details */}
                    <div className="lg:col-span-7 space-y-4">
                      <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-slate-400 tabular-nums">
                        <span className="text-[#38bdf8] font-semibold">
                          PROJECT {project.number}
                        </span>

                        <span aria-hidden="true">·</span>

                        <span>{project.status}</span>

                        {isStageActive && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#38bdf8]">
                              3D STAGE ACTIVE
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#f4f4f6]">
                        {project.title}
                      </h3>

                      <p className="text-xs sm:text-sm font-mono text-slate-400">
                        {project.subtitle}
                      </p>

                      <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-2xl">
                        {project.description}
                      </p>

                      {/* Technology Stack */}
                      <div className="pt-2">
                        <div className="font-mono text-[11px] text-slate-400 mb-1.5">
                          TECHNOLOGY STACK
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-xs text-[#38bdf8]">
                          {project.technologies.map((tech, index) => (
                            <React.Fragment key={tech}>
                              <span>{tech}</span>

                              {index < project.technologies.length - 1 && (
                                <span
                                  aria-hidden="true"
                                  className="text-slate-600"
                                >
                                  ·
                                </span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Architecture Preview & Actions */}
                    <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-6 bg-[#10141d]/90 border border-white/10 p-5 sm:p-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between font-mono text-xs text-slate-400">
                          <span>SYSTEM ARCHITECTURE STAGES</span>
                          <span className="text-[#38bdf8] tabular-nums">
                            4 STEPS
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {project.architectureFlow.map((step) => (
                            <div
                              key={step.stage}
                              className="p-3 bg-[#0b0d13] border border-white/10"
                            >
                              <div className="font-mono text-[11px] text-[#38bdf8]">
                                {step.stage}
                              </div>

                              <div className="mt-0.5 text-xs font-semibold text-[#f4f4f6] leading-snug">
                                {step.title}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playTick(520, 0.025);
                            setActiveProjectId(project.id);
                          }}
                          className={`px-3.5 py-2 font-mono text-xs border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                            isStageActive
                              ? 'border-[#38bdf8] text-[#38bdf8] bg-[#38bdf8]/10'
                              : 'border-white/15 text-slate-300 hover:text-white'
                          }`}
                        >
                          {isStageActive
                            ? '3D Diorama Active'
                            : 'Load in 3D Stage'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playPortalOpen();
                            setActiveProjectId(project.id);
                            setModalProject(project);
                          }}
                          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold tracking-wider text-[#07080a] bg-[#f4f4f6] hover:bg-[#38bdf8] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <span>Inspect Project</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ================================================================
            SCENE 04 — TECHNICAL CAPABILITIES
        ================================================================= */}
        <section
          id="scene-capabilities"
          aria-label="04. Technical Capabilities"
          className="cinematic-section max-w-[1380px] mx-auto px-6 py-24 md:py-32 border-t border-white/10"
        >
          <div className="gsap-reveal flex items-center gap-3 font-mono text-xs text-slate-400 mb-3">
            <span className="text-[#38bdf8]">04. TECHNICAL CAPABILITIES</span>
            <span aria-hidden="true">·</span>
            <span>INTERCONNECTED SYSTEM ARCHITECTURE</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
            <h2 className="gsap-reveal font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#f4f4f6] text-balance">
              Connected Capabilities Landscape
            </h2>

            <p className="gsap-reveal max-w-md text-xs sm:text-sm text-slate-300">
              Select any capability node below to inspect how enterprise
              operations, backend services, relational databases, and web
              interfaces connect across projects.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Interactive Capability Nodes */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PORTFOLIO_DATA.capabilities.map((capability, index) => {
                const isSelected =
                  capabilityNetwork.activeCapability.id === capability.id;

                const isConnected =
                  !isSelected &&
                  capabilityNetwork.connectedIds.includes(capability.id);

                return (
                  <button
                    key={capability.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playTick(580, 0.03);
                      setActiveCapabilityId(capability.id);
                    }}
                    className={`text-left p-5 border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#101624]/95 border-[#38bdf8]'
                        : isConnected
                        ? 'bg-[#0d111a]/90 border-[#38bdf8]/40 hover:border-[#38bdf8]'
                        : 'bg-[#0b0d13]/85 border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-xs text-slate-400 mb-2 tabular-nums">
                      <span>
                        0{index + 1} ·{' '}
                        {capability.category.split(' ')[0].toUpperCase()}
                      </span>

                      <span
                        className={
                          isSelected
                            ? 'text-[#38bdf8] font-semibold'
                            : isConnected
                            ? 'text-amber-300'
                            : 'text-slate-500'
                        }
                      >
                        {isSelected
                          ? 'SELECTED NODE'
                          : isConnected
                          ? 'LINKED NODE'
                          : 'NODE'}
                      </span>
                    </div>

                    <h3 className="font-display text-lg font-bold text-[#f4f4f6]">
                      {capability.title}
                    </h3>

                    <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                      {capability.summary}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Capability Inspector */}
            <div className="lg:col-span-5 bg-[#0b0d13]/95 border border-white/15 p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <div className="font-mono text-xs text-[#38bdf8]">
                    ACTIVE CAPABILITY NODE
                  </div>

                  <h3 className="font-display text-2xl font-bold text-[#f4f4f6] mt-1">
                    {capabilityNetwork.activeCapability.title}
                  </h3>
                </div>

                <Terminal className="w-5 h-5 text-[#38bdf8] shrink-0" />
              </div>

              {/* Interactive SVG Relationship Diagram */}
              <div className="p-4 bg-[#07080a] border border-white/10">
                <div className="font-mono text-[11px] text-slate-400 mb-2">
                  ARCHITECTURAL DEPENDENCY TOPOLOGY
                </div>

                <svg
                  viewBox="0 0 360 160"
                  className="w-full h-36 overflow-visible"
                  role="img"
                  aria-label={`Architecture connections for ${capabilityNetwork.activeCapability.title}`}
                >
                  {/* Connections to related nodes */}
                  {capabilityNetwork.activeCapability.connectedCapabilities.map(
                    (connectionId, index, connections) => {
                      const angle =
                        ((index + 1) / (connections.length + 1)) * Math.PI;

                      const tx =
                        180 + Math.cos(angle - Math.PI / 2) * 125;

                      const ty =
                        80 + Math.sin(angle - Math.PI / 2) * 52;

                      return (
                        <g key={connectionId}>
                          <line
                            x1={80}
                            y1={80}
                            x2={tx}
                            y2={ty}
                            stroke="#38bdf8"
                            strokeWidth="1.5"
                            strokeDasharray="4 3"
                          />

                          <circle
                            cx={tx}
                            cy={ty}
                            r="5"
                            fill="#0b0d13"
                            stroke="#f59e0b"
                            strokeWidth="2"
                          />

                          <text
                            x={tx + 10}
                            y={ty + 4}
                            fill="#cbd5e1"
                            fontSize="10"
                            fontFamily="JetBrains Mono, monospace"
                          >
                            {
                              PORTFOLIO_DATA.capabilities
                                .find((item) => item.id === connectionId)
                                ?.title.split(' ')[0]
                            }
                          </text>
                        </g>
                      );
                    }
                  )}

                  {/* Active Node */}
                  <circle cx={80} cy={80} r="10" fill="#38bdf8" />

                  <text
                    x={20}
                    y={112}
                    fill="#f4f4f6"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {capabilityNetwork.activeCapability.title}
                  </text>
                </svg>
              </div>

              <div>
                <div className="font-mono text-xs text-slate-400 mb-1.5">
                  OPERATIONAL APPLICATION
                </div>

                <p className="text-sm text-slate-200 leading-relaxed">
                  {capabilityNetwork.activeCapability.operationalApplication}
                </p>
              </div>

              {/* Connected Projects */}
              <div className="pt-4 border-t border-white/10">
                <div className="font-mono text-xs text-slate-400 mb-3">
                  APPLIED IN PORTFOLIO PROJECTS (
                  {capabilityNetwork.relatedProjects.length})
                </div>

                <div className="space-y-2">
                  {capabilityNetwork.relatedProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playPortalOpen();
                        setActiveProjectId(project.id);
                        setModalProject(project);
                      }}
                      className="w-full flex items-center justify-between p-3 bg-[#10141d] border border-white/10 hover:border-[#38bdf8] text-left transition-colors cursor-pointer"
                    >
                      <span className="text-xs font-medium text-[#f4f4f6]">
                        {project.number}. {project.title}
                      </span>

                      <ArrowUpRight className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            SCENE 05 — EXPERIENCE AND APPROACH
        ================================================================= */}
        <section
          id="scene-approach"
          aria-label="05. Experience and Approach"
          className="cinematic-section max-w-[1380px] mx-auto px-6 py-24 md:py-32 border-t border-white/10"
        >
          <div className="gsap-reveal flex items-center gap-3 font-mono text-xs text-slate-400 mb-3">
            <span className="text-[#38bdf8]">05. EXPERIENCE &amp; APPROACH</span>
            <span aria-hidden="true">·</span>
            <span>ENGINEERING PHILOSOPHY</span>
          </div>

          <div className="max-w-3xl mb-14">
            <h2 className="gsap-reveal font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#f4f4f6] text-balance">
              Operational Alignment &amp; Structured Data Integrity
            </h2>

            <p className="gsap-reveal mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              Practical software succeeds when it respects operational
              reality, enforces clean data structures, and removes repetitive
              manual spreadsheet bottlenecks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PORTFOLIO_DATA.experiencePillars.map((pillar) => (
              <div
                key={pillar.index}
                className="gsap-reveal bg-[#0b0d13]/90 border border-white/12 p-6 sm:p-8 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs text-slate-400">
                    <span className="text-[#38bdf8]">
                      PRINCIPLE {pillar.index}
                    </span>

                    <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                  </div>

                  <h3 className="font-display text-2xl font-bold text-[#f4f4f6]">
                    {pillar.title}
                  </h3>

                  <p className="text-sm font-medium text-[#38bdf8]">
                    {pillar.principle}
                  </p>

                  <p className="text-sm text-slate-300 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                {/* Operational Shift Comparison */}
                <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#10141d] border border-white/5">
                    <div className="font-mono text-[10px] text-slate-400 mb-1">
                      MANUAL BOTTLENECK
                    </div>

                    <div className="text-slate-300">
                      {pillar.operationalShift.from}
                    </div>
                  </div>

                  <div className="p-3 bg-[#10141d] border border-[#38bdf8]/30">
                    <div className="font-mono text-[10px] text-[#38bdf8] mb-1">
                      ENGINEERED WORKFLOW
                    </div>

                    <div className="text-[#f4f4f6]">
                      {pillar.operationalShift.to}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================================================================
            SCENE 06 — CONTACT
        ================================================================= */}
        <section
          id="scene-contact"
          aria-label="06. Contact"
          className="cinematic-section max-w-[1380px] mx-auto px-6 py-24 md:py-32 border-t border-white/10"
        >
          <div className="gsap-reveal flex items-center gap-3 font-mono text-xs text-slate-400 mb-4">
            <span className="text-[#38bdf8]">06. CONTACT</span>
            <span aria-hidden="true">·</span>
            <span>DIRECT CHANNELS &amp; INQUIRY</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: Contact Channels */}
            <div className="lg:col-span-6 space-y-8">
              <div>
                <h2 className="gsap-reveal font-display text-4xl sm:text-6xl font-bold tracking-tight text-[#f4f4f6] leading-[0.98] text-balance">
                  {PORTFOLIO_DATA.contact.headline}
                </h2>

                <p className="gsap-reveal mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
                  {PORTFOLIO_DATA.contact.subheadline}
                </p>
              </div>

              {/* Editable Contact Channels */}
              <div className="space-y-4">
                {PORTFOLIO_DATA.contact.channels.map((channel) => {
                  const isCopied = copiedChannelId === channel.id;

                  return (
                    <div
                      key={channel.id}
                      className="gsap-reveal p-5 bg-[#0b0d13]/90 border border-white/15 hover:border-[#38bdf8] transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <div className="font-mono text-xs text-[#38bdf8] uppercase">
                            {channel.label}
                          </div>

                          <div className="font-mono text-sm sm:text-base text-[#f4f4f6] mt-1 break-all">
                            {channel.value}
                          </div>

                          <div className="text-[11px] text-slate-400 mt-1">
                            {channel.placeholderNote}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyContact(channel.id, channel.value)
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono text-slate-300 hover:text-white border border-white/15 cursor-pointer whitespace-nowrap shrink-0"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#38bdf8]" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          <a
                            href={channel.href}
                            target={
                              channel.href.startsWith('http')
                                ? '_blank'
                                : undefined
                            }
                            rel={
                              channel.href.startsWith('http')
                                ? 'noopener noreferrer'
                                : undefined
                            }
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#07080a] bg-[#f4f4f6] hover:bg-[#38bdf8] transition-colors whitespace-nowrap shrink-0"
                          >
                            <span>{channel.actionLabel}</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Inquiry Form */}
            <div className="lg:col-span-6 gsap-reveal bg-[#0b0d13]/95 border border-white/15 p-6 sm:p-10">
              <div className="font-mono text-xs text-[#38bdf8] mb-2">
                DIRECT DISPATCH COMPOSER
              </div>

              <h3 className="font-display text-2xl font-bold text-[#f4f4f6] mb-6">
                Start a Conversation
              </h3>

              <form
                onSubmit={handleInquirySubmit}
                noValidate
                className="space-y-5"
              >
                <div>
                  <label
                    htmlFor="inquiry-name"
                    className="block font-mono text-xs text-slate-300 mb-2"
                  >
                    YOUR NAME
                  </label>

                  <input
                    id="inquiry-name"
                    type="text"
                    value={inquiryForm.name}
                    onChange={(e) =>
                      setInquiryForm((prev) => ({
                        ...prev,
                        name: e.target.value
                      }))
                    }
                    placeholder="e.g., Alex Morgan"
                    className="w-full px-4 py-3 bg-[#07080a] border border-white/15 text-sm text-[#f4f4f6] focus:outline-none focus:border-[#38bdf8]"
                  />

                  {inquiryErrors.name && (
                    <p role="alert" className="mt-1.5 text-xs text-amber-400">
                      {inquiryErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="inquiry-email"
                    className="block font-mono text-xs text-slate-300 mb-2"
                  >
                    EMAIL ADDRESS
                  </label>

                  <input
                    id="inquiry-email"
                    type="email"
                    value={inquiryForm.email}
                    onChange={(e) =>
                      setInquiryForm((prev) => ({
                        ...prev,
                        email: e.target.value
                      }))
                    }
                    placeholder="name@organization.com"
                    className="w-full px-4 py-3 bg-[#07080a] border border-white/15 text-sm text-[#f4f4f6] focus:outline-none focus:border-[#38bdf8]"
                  />

                  {inquiryErrors.email && (
                    <p role="alert" className="mt-1.5 text-xs text-amber-400">
                      {inquiryErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="inquiry-topic"
                    className="block font-mono text-xs text-slate-300 mb-2"
                  >
                    DISCUSSION FOCUS
                  </label>

                  <select
                    id="inquiry-topic"
                    value={inquiryForm.topic}
                    onChange={(e) =>
                      setInquiryForm((prev) => ({
                        ...prev,
                        topic: e.target.value
                      }))
                    }
                    className="w-full px-4 py-3 bg-[#07080a] border border-white/15 text-sm text-[#f4f4f6] focus:outline-none focus:border-[#38bdf8]"
                  >
                    <option value="SAP / Operational Workflow Tool">
                      SAP / Operational Workflow Tool
                    </option>

                    <option value="Python & Django Web Application">
                      Python &amp; Django Web Application
                    </option>

                    <option value="Data Dashboard & SQL Reporting">
                      Data Dashboard &amp; SQL Reporting
                    </option>

                    <option value="Role / Collaboration Opportunity">
                      Role / Collaboration Opportunity
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="inquiry-message"
                    className="block font-mono text-xs text-slate-300 mb-2"
                  >
                    PROJECT OR OPERATIONAL BRIEF
                  </label>

                  <textarea
                    id="inquiry-message"
                    rows={4}
                    value={inquiryForm.message}
                    onChange={(e) =>
                      setInquiryForm((prev) => ({
                        ...prev,
                        message: e.target.value
                      }))
                    }
                    placeholder="Describe the operational workflow, web application, or role you would like to discuss..."
                    className="w-full px-4 py-3 bg-[#07080a] border border-white/15 text-sm text-[#f4f4f6] focus:outline-none focus:border-[#38bdf8]"
                  />

                  {inquiryErrors.message && (
                    <p role="alert" className="mt-1.5 text-xs text-amber-400">
                      {inquiryErrors.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-xs sm:text-sm font-semibold tracking-wider text-[#07080a] bg-[#f4f4f6] hover:bg-[#38bdf8] transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </form>

              {/* Contact Form Status */}
              {inquiryStatus && (
                <div
                  role="status"
                  className="mt-6 p-4 bg-[#101622] border border-[#38bdf8]/40 space-y-2"
                >
                  <div className="font-mono text-xs text-[#38bdf8]">
                    EMAIL COMPOSER READY
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {inquiryStatus}
                  </p>

                  <a
                    href="mailto:knnt1792000@gmail.com"
                    className="inline-flex items-center gap-2 text-xs text-[#38bdf8] hover:text-white underline underline-offset-4"
                  >
                    Open email app
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[#07080a]/95 py-8 px-6">
        <div className="max-w-[1380px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © {new Date().getFullYear()} {PORTFOLIO_DATA.profile.fullName}.
            All rights reserved.
          </div>

          <div className="flex items-center gap-4">
            <a
              href="#scene-intro"
              className="hover:text-white transition-colors"
            >
              Top of Stage
            </a>

            <span aria-hidden="true">·</span>

            <a
              href="#scene-work"
              className="hover:text-white transition-colors"
            >
              Selected Work
            </a>

            <span aria-hidden="true">·</span>

            <a
              href="#scene-contact"
              className="hover:text-white transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>

      {/* Project Case Study Modal */}
      <ProjectModal
        project={modalProject}
        onClose={() => setModalProject(null)}
        onSelectProject={(id) => {
          const next = PORTFOLIO_DATA.projects.find(
            (project) => project.id === id
          );

          if (next) {
            setActiveProjectId(next.id);
            setModalProject(next);
          }
        }}
        allProjects={PORTFOLIO_DATA.projects}
      />

      {/* Collapsible Bottom 3D & Experience Control Dock */}
      <ControlDock
        activeSceneIndex={activeSceneIndex}
        cameraMode={cameraMode}
        reducedMotion={reducedMotion}
        audioEnabled={audioEnabled}
        onNavigateScene={handleNavigateScene}
        onToggleCameraMode={() => {
          soundEngine.playTick(500, 0.025);

          setCameraMode((prev) =>
            prev === 'story' ? 'inspection' : 'story'
          );
        }}
        onToggleReducedMotion={() => {
          setReducedMotion((prev) => !prev);
        }}
        onToggleAudio={() => {
          const next = !audioEnabled;

          soundEngine.setEnabled(next);
          setAudioEnabled(next);
        }}
      />
    </div>
  );
}