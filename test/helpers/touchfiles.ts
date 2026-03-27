/**
 * Diff-based test selection for E2E and LLM-judge evals.
 *
 * Each test declares which source files it depends on ("touchfiles").
 * The test runner checks `git diff` and only runs tests whose
 * dependencies were modified. Override with EVALS_ALL=1 to run everything.
 */

import { spawnSync } from 'child_process';

/**
 * Match a file path against a glob pattern.
 * Supports:
 *   ** - match any number of path segments
 *   *  - match within a single segment (no /)
 */
export function matchGlob(file: string, pattern: string): boolean {
  const regexStr = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/\{\{GLOBSTAR\}\}/g, '.*');
  return new RegExp(`^${regexStr}$`).test(file);
}

/**
 * E2E test touchfiles keyed by testName.
 */
export const E2E_TOUCHFILES: Record<string, string[]> = {
  // Browse core
  'browse-basic': ['browse/src/**'],
  'browse-snapshot': ['browse/src/**'],

  // Root skill and preamble coverage
  'skillmd-setup-discovery': ['SKILL.md', 'SKILL.md.tmpl'],
  'skillmd-no-local-binary': ['SKILL.md', 'SKILL.md.tmpl'],
  'skillmd-outside-git': ['SKILL.md', 'SKILL.md.tmpl'],
  'contributor-mode': ['SKILL.md', 'SKILL.md.tmpl'],
  'session-awareness': ['SKILL.md', 'SKILL.md.tmpl'],

  // astack workflow artifacts
  'scope-artifact': ['scope/**'],
  'research-artifact': ['research/**'],
  'plan-artifact': ['plan/**'],
  'implement-progress': ['implement/**'],

  // QA and review
  'qa-quick': ['qa/**', 'browse/src/**'],
  'qa-b6-static': ['qa/**', 'browse/src/**', 'browse/test/fixtures/qa-eval.html', 'test/fixtures/qa-eval-ground-truth.json'],
  'qa-b7-spa': ['qa/**', 'browse/src/**', 'browse/test/fixtures/qa-eval-spa.html', 'test/fixtures/qa-eval-spa-ground-truth.json'],
  'qa-b8-checkout': ['qa/**', 'browse/src/**', 'browse/test/fixtures/qa-eval-checkout.html', 'test/fixtures/qa-eval-checkout-ground-truth.json'],
  'qa-only-no-fix': ['qa-only/**', 'qa/templates/**'],
  'qa-fix-loop': ['qa/**', 'browse/src/**'],
  'qa-bootstrap': ['qa/**', 'browse/src/**', 'ship/**'],

  'review-sql-injection': ['review/**', 'test/fixtures/review-eval-vuln.rb'],
  'review-enum-completeness': ['review/**', 'test/fixtures/review-eval-enum*.rb'],
  'review-base-branch': ['review/**'],
  'review-design-lite': ['review/**', 'test/fixtures/review-eval-design-slop.*'],

  // Operational skills
  'ship-base-branch': ['ship/**'],
  'ship-coverage-audit': ['ship/**'],
  'retro': ['retro/**'],
  'retro-base-branch': ['retro/**'],
  'document-release': ['document-release/**'],

  // Design
  'design-consultation-core': ['design-consultation/**'],
  'design-consultation-research': ['design-consultation/**'],
  'design-consultation-existing': ['design-consultation/**'],
  'design-consultation-preview': ['design-consultation/**'],
  'design-review-fix': ['design-review/**', 'browse/src/**'],

  // Upgrade
  'astack-upgrade-happy-path': ['astack-upgrade/**'],

  // Cross-tool evals
  'codex-review': ['codex/**'],
  'codex-discover-skill': ['codex/**', '.agents/skills/**', 'test/helpers/codex-session-runner.ts'],
  'codex-review-findings': ['review/**', '.agents/skills/review-astack/**', 'codex/**', 'test/helpers/codex-session-runner.ts'],
  'gemini-discover-skill': ['.agents/skills/**', 'test/helpers/gemini-session-runner.ts'],
  'gemini-review-findings': ['review/**', '.agents/skills/review-astack/**', 'test/helpers/gemini-session-runner.ts'],

  // Skill routing
  'journey-scope': ['scope/**', 'SKILL.md.tmpl', 'scripts/gen-skill-docs.ts'],
  'journey-research': ['research/**', 'SKILL.md.tmpl', 'scripts/gen-skill-docs.ts'],
  'journey-plan': ['plan/**', 'SKILL.md.tmpl', 'scripts/gen-skill-docs.ts'],
  'journey-roadmap': ['roadmap/**', 'SKILL.md.tmpl', 'scripts/gen-skill-docs.ts'],
  'journey-implement': ['implement/**', 'SKILL.md.tmpl', 'scripts/gen-skill-docs.ts'],
  'journey-debug': ['investigate/**', 'SKILL.md.tmpl', 'scripts/gen-skill-docs.ts'],
  'journey-qa': ['qa/**', 'qa-only/**', 'browse/**', 'SKILL.md.tmpl', 'scripts/gen-skill-docs.ts'],
  'journey-code-review': ['review/**', 'SKILL.md.tmpl', 'scripts/gen-skill-docs.ts'],
  'journey-ship': ['ship/**', 'SKILL.md.tmpl', 'scripts/gen-skill-docs.ts'],
  'journey-docs': ['document-release/**', 'SKILL.md.tmpl', 'scripts/gen-skill-docs.ts'],
  'journey-retro': ['retro/**', 'SKILL.md.tmpl', 'scripts/gen-skill-docs.ts'],
  'journey-design-system': ['design-consultation/**', 'SKILL.md.tmpl', 'scripts/gen-skill-docs.ts'],
  'journey-visual-qa': ['design-review/**', 'SKILL.md.tmpl', 'scripts/gen-skill-docs.ts'],
};

/**
 * LLM-judge test touchfiles keyed by human-readable test description.
 */
export const LLM_JUDGE_TOUCHFILES: Record<string, string[]> = {
  'command reference table': ['SKILL.md', 'SKILL.md.tmpl', 'browse/src/commands.ts'],
  'snapshot flags reference': ['SKILL.md', 'SKILL.md.tmpl', 'browse/src/snapshot.ts'],
  'browse/SKILL.md reference': ['browse/SKILL.md', 'browse/SKILL.md.tmpl', 'browse/src/**'],
  'setup block': ['SKILL.md', 'SKILL.md.tmpl'],
  'regression vs baseline': ['SKILL.md', 'SKILL.md.tmpl', 'browse/src/commands.ts', 'test/fixtures/eval-baselines.json'],

  'scope/SKILL.md artifact': ['scope/SKILL.md', 'scope/SKILL.md.tmpl'],
  'research/SKILL.md artifact': ['research/SKILL.md', 'research/SKILL.md.tmpl'],
  'plan/SKILL.md artifact': ['plan/SKILL.md', 'plan/SKILL.md.tmpl'],
  'implement/SKILL.md progress': ['implement/SKILL.md', 'implement/SKILL.md.tmpl'],

  'qa/SKILL.md workflow': ['qa/SKILL.md', 'qa/SKILL.md.tmpl'],
  'qa/SKILL.md health rubric': ['qa/SKILL.md', 'qa/SKILL.md.tmpl'],
  'qa/SKILL.md anti-refusal': ['qa/SKILL.md', 'qa/SKILL.md.tmpl', 'qa-only/SKILL.md', 'qa-only/SKILL.md.tmpl'],
  'qa-only/SKILL.md workflow': ['qa-only/SKILL.md', 'qa-only/SKILL.md.tmpl'],
  'ship/SKILL.md workflow': ['ship/SKILL.md', 'ship/SKILL.md.tmpl'],
  'document-release/SKILL.md workflow': ['document-release/SKILL.md', 'document-release/SKILL.md.tmpl'],
  'retro/SKILL.md instructions': ['retro/SKILL.md', 'retro/SKILL.md.tmpl'],
  'design-review/SKILL.md fix loop': ['design-review/SKILL.md', 'design-review/SKILL.md.tmpl'],
  'design-consultation/SKILL.md research': ['design-consultation/SKILL.md', 'design-consultation/SKILL.md.tmpl'],
  'cross-skill greptile consistency': ['review/SKILL.md', 'review/SKILL.md.tmpl', 'ship/SKILL.md', 'ship/SKILL.md.tmpl', 'review/greptile-triage.md', 'retro/SKILL.md', 'retro/SKILL.md.tmpl'],
  'baseline score pinning': ['SKILL.md', 'SKILL.md.tmpl', 'test/fixtures/eval-baselines.json'],
  'astack-upgrade/SKILL.md upgrade flow': ['astack-upgrade/SKILL.md', 'astack-upgrade/SKILL.md.tmpl'],
};

/**
 * Changes to any of these files trigger all evals.
 */
export const GLOBAL_TOUCHFILES = [
  'test/helpers/session-runner.ts',
  'test/helpers/codex-session-runner.ts',
  'test/helpers/gemini-session-runner.ts',
  'test/helpers/eval-store.ts',
  'test/helpers/llm-judge.ts',
  'scripts/gen-skill-docs.ts',
  'test/helpers/touchfiles.ts',
  'browse/test/test-server.ts',
];

/**
 * Detect the base branch by trying refs in order.
 */
export function detectBaseBranch(cwd: string): string | null {
  for (const ref of ['origin/main', 'origin/master', 'main', 'master']) {
    const result = spawnSync('git', ['rev-parse', '--verify', ref], {
      cwd,
      stdio: 'pipe',
      timeout: 3000,
    });
    if (result.status === 0) return ref;
  }
  return null;
}

/**
 * Get files changed between a base branch and HEAD.
 */
export function getChangedFiles(baseBranch: string, cwd: string): string[] {
  const result = spawnSync('git', ['diff', '--name-only', `${baseBranch}...HEAD`], {
    cwd,
    stdio: 'pipe',
    timeout: 5000,
  });
  if (result.status !== 0) return [];
  return result.stdout.toString().trim().split('\n').filter(Boolean);
}

/**
 * Select tests to run based on changed files.
 */
export function selectTests(
  changedFiles: string[],
  touchfiles: Record<string, string[]>,
  globalTouchfiles: string[] = GLOBAL_TOUCHFILES,
): { selected: string[]; skipped: string[]; reason: string } {
  const allTestNames = Object.keys(touchfiles);

  for (const file of changedFiles) {
    if (globalTouchfiles.some((glob) => matchGlob(file, glob))) {
      return { selected: allTestNames, skipped: [], reason: `global: ${file}` };
    }
  }

  const selected: string[] = [];
  const skipped: string[] = [];

  for (const [testName, patterns] of Object.entries(touchfiles)) {
    const hit = changedFiles.some((file) => patterns.some((pattern) => matchGlob(file, pattern)));
    (hit ? selected : skipped).push(testName);
  }

  return { selected, skipped, reason: 'diff' };
}
