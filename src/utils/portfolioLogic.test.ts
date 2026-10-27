import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clamp01,
  getSceneIndexFromProgress,
  interpolateSceneWaypoints,
  getCapabilityNetworkState,
  filterProjectsByCategory,
  validateInquiryForm,
  evaluateIntroSkip
} from './portfolioLogic';
import { PORTFOLIO_DATA } from '../data/portfolioData';

test('clamp01 bounds values between 0 and 1', () => {
  assert.equal(clamp01(-0.5), 0);
  assert.equal(clamp01(0.45), 0.45);
  assert.equal(clamp01(1.8), 1);
  assert.equal(clamp01(Number.NaN), 0);
});

test('getSceneIndexFromProgress maps scroll progress across all 6 scenes accurately', () => {
  assert.equal(getSceneIndexFromProgress(0, 6), 0);
  assert.equal(getSceneIndexFromProgress(0.2, 6), 1);
  assert.equal(getSceneIndexFromProgress(0.4, 6), 2);
  assert.equal(getSceneIndexFromProgress(0.6, 6), 3);
  assert.equal(getSceneIndexFromProgress(0.8, 6), 4);
  assert.equal(getSceneIndexFromProgress(1.0, 6), 5);
});

test('interpolateSceneWaypoints returns exact start and end camera waypoints at boundaries', () => {
  const startState = interpolateSceneWaypoints(0);
  assert.deepEqual(startState.position, PORTFOLIO_DATA.scenes[0].cameraPos);
  assert.equal(startState.activeSceneIndex, 0);

  const endState = interpolateSceneWaypoints(1);
  const lastScene = PORTFOLIO_DATA.scenes[PORTFOLIO_DATA.scenes.length - 1];
  assert.deepEqual(endState.position, lastScene.cameraPos);
  assert.equal(endState.activeSceneIndex, PORTFOLIO_DATA.scenes.length - 1);
});

test('getCapabilityNetworkState resolves connected skills and grounded projects', () => {
  const state = getCapabilityNetworkState('python-django');
  assert.equal(state.activeCapability.title, 'Python and Django');
  assert.ok(state.connectedIds.includes('python-django'));
  assert.ok(state.connectedIds.includes('rest-apis'));
  assert.equal(state.relatedProjects.length, 5);
});

test('filterProjectsByCategory filters projects by technology stack accurately', () => {
  const all = filterProjectsByCategory('ALL');
  assert.equal(all.length, 5);

  const kotlinProjects = filterProjectsByCategory('Kotlin');
  assert.equal(kotlinProjects.length, 1);
  assert.equal(kotlinProjects[0].id, 'warehouse-stock-counting');

  const openpyxlProjects = filterProjectsByCategory('openpyxl');
  assert.equal(openpyxlProjects.length, 1);
  assert.equal(openpyxlProjects[0].id, 'gps-outlet-operations');
});

test('validateInquiryForm enforces required fields and valid email format', () => {
  const invalid = validateInquiryForm({
    name: 'K',
    email: 'not-an-email',
    topic: 'SAP / Operations',
    message: 'Short'
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.name);
  assert.ok(invalid.errors.email);
  assert.ok(invalid.errors.message);

  const valid = validateInquiryForm({
    name: 'Operational Lead',
    email: 'lead@enterprise.org',
    topic: 'Web Application',
    message: 'Looking to automate our warehouse stock reconciliation workflow.'
  });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.errors, {});
});

test('evaluateIntroSkip respects autostart query parameter, reduced motion, and session state', () => {
  assert.equal(
    evaluateIntroSkip({
      searchParamsString: '?autostart=1',
      prefersReducedMotion: false,
      hasSeenInSession: false
    }),
    true
  );
  assert.equal(
    evaluateIntroSkip({
      searchParamsString: '',
      prefersReducedMotion: true,
      hasSeenInSession: false
    }),
    true
  );
  assert.equal(
    evaluateIntroSkip({
      searchParamsString: '',
      prefersReducedMotion: false,
      hasSeenInSession: false
    }),
    false
  );
});
