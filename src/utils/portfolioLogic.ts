import { PORTFOLIO_DATA, PortfolioProject, SceneWaypoint, TechnicalCapability } from '../data/portfolioData';

export interface InterpolatedCameraState {
  position: [number, number, number];
  lookAt: [number, number, number];
  fogDensity: number;
  activeSceneIndex: number;
  segmentProgress: number;
}

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function smoothstep(t: number): number {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

export function lerpNumber(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function getSceneIndexFromProgress(progress: number, totalScenes: number = PORTFOLIO_DATA.scenes.length): number {
  if (totalScenes <= 1) return 0;
  const p = clamp01(progress);
  const rawIndex = Math.round(p * (totalScenes - 1));
  return Math.max(0, Math.min(totalScenes - 1, rawIndex));
}

export function interpolateSceneWaypoints(
  progress: number,
  waypoints: SceneWaypoint[] = PORTFOLIO_DATA.scenes
): InterpolatedCameraState {
  if (waypoints.length === 0) {
    return {
      position: [0, 2, 12],
      lookAt: [0, 0, 0],
      fogDensity: 0.028,
      activeSceneIndex: 0,
      segmentProgress: 0
    };
  }
  if (waypoints.length === 1) {
    return {
      position: [...waypoints[0].cameraPos],
      lookAt: [...waypoints[0].lookAt],
      fogDensity: waypoints[0].fogDensity,
      activeSceneIndex: 0,
      segmentProgress: 0
    };
  }

  const p = clamp01(progress);
  const scaled = p * (waypoints.length - 1);
  const lowerIdx = Math.min(Math.floor(scaled), waypoints.length - 2);
  const upperIdx = lowerIdx + 1;
  const localT = smoothstep(scaled - lowerIdx);

  const start = waypoints[lowerIdx];
  const end = waypoints[upperIdx];

  const position: [number, number, number] = [
    lerpNumber(start.cameraPos[0], end.cameraPos[0], localT),
    lerpNumber(start.cameraPos[1], end.cameraPos[1], localT),
    lerpNumber(start.cameraPos[2], end.cameraPos[2], localT)
  ];

  const lookAt: [number, number, number] = [
    lerpNumber(start.lookAt[0], end.lookAt[0], localT),
    lerpNumber(start.lookAt[1], end.lookAt[1], localT),
    lerpNumber(start.lookAt[2], end.lookAt[2], localT)
  ];

  const fogDensity = lerpNumber(start.fogDensity, end.fogDensity, localT);

  return {
    position,
    lookAt,
    fogDensity,
    activeSceneIndex: getSceneIndexFromProgress(p, waypoints.length),
    segmentProgress: localT
  };
}

export interface CapabilityNetworkState {
  activeCapability: TechnicalCapability;
  connectedIds: string[];
  relatedProjects: PortfolioProject[];
}

export function getCapabilityNetworkState(
  capabilityId: string,
  capabilities: TechnicalCapability[] = PORTFOLIO_DATA.capabilities,
  projects: PortfolioProject[] = PORTFOLIO_DATA.projects
): CapabilityNetworkState {
  const found = capabilities.find((c) => c.id === capabilityId) || capabilities[0];
  const connectedIds = found ? [found.id, ...found.connectedCapabilities] : [];
  const relatedProjects = found
    ? projects.filter((proj) => found.relatedProjectIds.includes(proj.id))
    : [];

  return {
    activeCapability: found,
    connectedIds,
    relatedProjects
  };
}

export function filterProjectsByCategory(
  filterTag: string,
  projects: PortfolioProject[] = PORTFOLIO_DATA.projects
): PortfolioProject[] {
  if (!filterTag || filterTag === 'ALL') {
    return projects;
  }
  const normalized = filterTag.toLowerCase();
  return projects.filter((project) =>
    project.technologies.some((tech) => tech.toLowerCase().includes(normalized))
  );
}

export interface InquiryFormInput {
  name: string;
  email: string;
  topic: string;
  message: string;
}

export interface InquiryValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof InquiryFormInput, string>>;
}

export function validateInquiryForm(input: InquiryFormInput): InquiryValidationResult {
  const errors: Partial<Record<keyof InquiryFormInput, string>> = {};
  const trimmedName = (input.name || '').trim();
  const trimmedEmail = (input.email || '').trim();
  const trimmedMessage = (input.message || '').trim();

  if (trimmedName.length < 2) {
    errors.name = 'Please enter your name (at least 2 characters).';
  }
  if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = 'Please provide a valid email address.';
  }
  if (trimmedMessage.length < 10) {
    errors.message = 'Please include a brief project or operational note (10+ characters).';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export function evaluateIntroSkip(options: {
  searchParamsString: string;
  prefersReducedMotion: boolean;
  hasSeenInSession: boolean;
}): boolean {
  if (options.prefersReducedMotion) return true;
  if (options.hasSeenInSession) return true;
  const params = new URLSearchParams(options.searchParamsString);
  if (params.get('autostart') === '1' || params.get('skipIntro') === '1') {
    return true;
  }
  return false;
}
