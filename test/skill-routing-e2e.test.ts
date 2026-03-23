import { afterAll, describe, test, expect } from 'bun:test';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { EvalCollector } from './helpers/eval-store';
import type { SkillTestResult } from './helpers/session-runner';
import { runSkillTest } from './helpers/session-runner';
import { detectBaseBranch, E2E_TOUCHFILES, getChangedFiles, GLOBAL_TOUCHFILES, selectTests } from './helpers/touchfiles';

const ROOT = path.resolve(import.meta.dir, '..');
const evalsEnabled = !!process.env.EVALS;
const describeE2E = evalsEnabled ? describe : describe.skip;
const evalCollector = evalsEnabled ? new EvalCollector('e2e-routing') : null;
const runId = new Date().toISOString().replace(/[:.]/g, '').replace('T', '-').slice(0, 15);

let selectedTests: string[] | null = null;

if (evalsEnabled && !process.env.EVALS_ALL) {
  const baseBranch = process.env.EVALS_BASE || detectBaseBranch(ROOT) || 'main';
  const changedFiles = getChangedFiles(baseBranch, ROOT);

  if (changedFiles.length > 0) {
    const selection = selectTests(changedFiles, E2E_TOUCHFILES, GLOBAL_TOUCHFILES);
    selectedTests = selection.selected;
    process.stderr.write(`\nRouting E2E selection (${selection.reason}): ${selection.selected.length}/${Object.keys(E2E_TOUCHFILES).length} tests\n`);
    if (selection.skipped.length > 0) {
      process.stderr.write(`  Skipped: ${selection.skipped.join(', ')}\n`);
    }
    process.stderr.write('\n');
  }
}

function testIfSelected(testName: string, fn: () => Promise<void>, timeout: number) {
  const shouldRun = selectedTests === null || selectedTests.includes(testName);
  (shouldRun ? test : test.skip)(testName, fn, timeout);
}

function git(cwd: string, args: string[]) {
  return spawnSync('git', args, { cwd, stdio: 'pipe', timeout: 5000 });
}

function initGitRepo(dir: string) {
  git(dir, ['init']);
  git(dir, ['config', 'user.email', 'test@test.com']);
  git(dir, ['config', 'user.name', 'Test']);
}

function commitAll(dir: string, message: string) {
  git(dir, ['add', '.']);
  git(dir, ['commit', '-m', message]);
}

function installSkills(tmpDir: string) {
  const skillDirs = [
    '',
    'scope',
    'research',
    'plan',
    'implement',
    'qa',
    'qa-only',
    'ship',
    'review',
    'design-review',
    'design-consultation',
    'retro',
    'document-release',
    'investigate',
    'browse',
    'setup-browser-cookies',
    'astack-upgrade',
  ];

  for (const skill of skillDirs) {
    const srcPath = path.join(ROOT, skill, 'SKILL.md');
    if (!fs.existsSync(srcPath)) continue;

    const destDir = skill
      ? path.join(tmpDir, '.claude', 'skills', 'astack', skill)
      : path.join(tmpDir, '.claude', 'skills', 'astack');
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(srcPath, path.join(destDir, 'SKILL.md'));
  }
}

function setupReleaseArtifacts(tmpDir: string, artifactName: string, sections: string[]) {
  const releasesDir = path.join(tmpDir, 'docs', 'releases');
  fs.mkdirSync(releasesDir, { recursive: true });
  fs.writeFileSync(path.join(releasesDir, 'VERSION'), '0.0.1.0\n');
  fs.writeFileSync(path.join(releasesDir, 'RELEASE_LOG.md'), '# Release Log\n');
  fs.writeFileSync(path.join(releasesDir, artifactName), `# Release\n\n${sections.join('\n\n')}\n`);
}

function logCost(label: string, result: SkillTestResult) {
  const { estimatedCost, estimatedTokens, turnsUsed } = result.costEstimate;
  const durationSec = Math.round(result.duration / 1000);
  console.log(`${label}: $${estimatedCost.toFixed(2)} (${turnsUsed} turns, ${(estimatedTokens / 1000).toFixed(1)}k tokens, ${durationSec}s)`);
}

function recordRouting(name: string, result: SkillTestResult, expectedSkill: string, actualSkill: string | undefined) {
  evalCollector?.addTest({
    name,
    suite: 'Skill Routing E2E',
    tier: 'e2e',
    passed: actualSkill === expectedSkill,
    duration_ms: result.duration,
    cost_usd: result.costEstimate.estimatedCost,
    transcript: result.transcript,
    output: result.output?.slice(0, 2000),
    turns_used: result.costEstimate.turnsUsed,
    exit_reason: result.exitReason,
  });
}

async function runRoutingCase(options: {
  testName: string;
  prompt: string;
  expectedSkill: string;
  acceptedSkills?: string[];
  maxTurns?: number;
  setup: (tmpDir: string) => void;
}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `${options.testName}-`));
  try {
    initGitRepo(tmpDir);
    installSkills(tmpDir);
    options.setup(tmpDir);

    const result = await runSkillTest({
      prompt: options.prompt,
      workingDirectory: tmpDir,
      maxTurns: options.maxTurns ?? 5,
      allowedTools: ['Skill', 'Read', 'Bash', 'Glob', 'Grep'],
      timeout: 90_000,
      testName: options.testName,
      runId,
    });

    const skillCalls = result.toolCalls.filter((call) => call.tool === 'Skill');
    const actualSkill = skillCalls.length > 0 ? skillCalls[0]?.input?.skill : undefined;
    const acceptable = options.acceptedSkills ?? [options.expectedSkill];

    logCost(`journey: ${options.testName}`, result);
    recordRouting(options.testName, result, options.expectedSkill, actualSkill);

    expect(skillCalls.length).toBeGreaterThan(0);
    expect(acceptable).toContain(actualSkill);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

describeE2E('Skill Routing E2E - astack journey', () => {
  afterAll(() => {
    evalCollector?.finalize();
  });

  testIfSelected('journey-scope', async () => {
    await runRoutingCase({
      testName: 'journey-scope',
      expectedSkill: 'scope-astack',
      prompt: 'Use /scope-astack on this idea: we want a lightweight call-note summarizer for a 6-person sales team. Today reps paste notes into Slack and lose follow-ups. The first wedge should help reps capture notes, draft next actions, and keep the team aligned.',
      setup: (tmpDir) => {
        fs.writeFileSync(path.join(tmpDir, 'README.md'), '# Sales Notes\n');
        commitAll(tmpDir, 'initial');
      },
    });
  }, 120_000);

  testIfSelected('journey-end-to-end', async () => {
    await runRoutingCase({
      testName: 'journey-end-to-end',
      expectedSkill: 'scope-astack',
      prompt: 'Use /scope-astack for an end-to-end enhancement that should move one request through scope, research, plan, implement, QA, and ship without manual orchestration unless a human decision is required.',
      setup: (tmpDir) => {
        fs.writeFileSync(path.join(tmpDir, 'README.md'), '# End to End\n');
        setupReleaseArtifacts(tmpDir, '0.0.1.0-end-to-end.md', [
          '# Scope\n\n## Problem\n- One enhancement still needs too much manual handoff.\n',
          '## Research\n',
          '## Plan\n',
          '## Progress\n',
          '## QA\n',
          '## Release Notes\n',
        ]);
        commitAll(tmpDir, 'initial');
      },
    });
  }, 120_000);

  testIfSelected('journey-research', async () => {
    await runRoutingCase({
      testName: 'journey-research',
      expectedSkill: 'research-astack',
      prompt: 'Use /research-astack before we plan this feature. I want you to map what already exists in the repo, what we can reuse, and what constraints matter.',
      setup: (tmpDir) => {
        fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
        setupReleaseArtifacts(tmpDir, '0.0.1.0-sales-notes.md', [
          '# Scope\n\n## Problem\n- Reps lose follow-ups.\n\n## Audience\n- Small sales team\n',
        ]);
        fs.writeFileSync(path.join(tmpDir, 'src', 'notes.ts'), 'export function summarizeNotes(input: string) { return input.trim(); }\n');
        fs.writeFileSync(path.join(tmpDir, 'README.md'), '# Sales Notes\n');
        commitAll(tmpDir, 'initial');
      },
    });
  }, 120_000);

  testIfSelected('journey-plan', async () => {
    await runRoutingCase({
      testName: 'journey-plan',
      expectedSkill: 'plan-astack',
      prompt: 'Use /plan-astack to turn the scoped and researched work into the final implementation plan before coding starts.',
      setup: (tmpDir) => {
        setupReleaseArtifacts(tmpDir, '0.0.1.0-sales-notes.md', [
          '# Scope\n\n## Problem\n- Reps lose follow-ups.\n',
          '## Research\n\n### Current System Map\n- `src/notes.ts`\n\n### Recommended Direction\n- Extend note summarization into action extraction.\n',
        ]);
        fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
        fs.writeFileSync(path.join(tmpDir, 'src', 'notes.ts'), 'export function summarizeNotes(input: string) { return input.trim(); }\n');
        commitAll(tmpDir, 'initial');
      },
    });
  }, 120_000);

  testIfSelected('journey-implement', async () => {
    await runRoutingCase({
      testName: 'journey-implement',
      expectedSkill: 'implement-astack',
      prompt: 'Use /implement-astack to build the approved plan and keep progress current.',
      setup: (tmpDir) => {
        fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
        setupReleaseArtifacts(tmpDir, '0.0.1.0-sales-notes.md', [
          `## Plan

### Summary
- Add structured action extraction for note summaries

### What Already Exists
- \`src/notes.ts\`

### Concrete Changes
- Update \`src/notes.ts\` to return a summary and action list
- Add a simple test file

### QA And Test Matrix
- Verify a note with an action item returns that action

### Not In Scope
- CRM sync
`,
        ]);
        fs.writeFileSync(path.join(tmpDir, 'src', 'notes.ts'), 'export function summarizeNotes(input: string) { return { summary: input.trim(), actions: [] as string[] }; }\n');
        fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'sales-notes', scripts: { test: 'bun test' } }, null, 2));
        commitAll(tmpDir, 'initial');
      },
      maxTurns: 8,
    });
  }, 150_000);

  testIfSelected('journey-debug', async () => {
    await runRoutingCase({
      testName: 'journey-debug',
      expectedSkill: 'investigate-astack',
      prompt: 'The API was working yesterday but now GET /api/notes is returning 500s in production. Please debug this failure.',
      setup: (tmpDir) => {
        fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
        fs.writeFileSync(path.join(tmpDir, 'src', 'api.ts'), 'export async function listNotes(db: any) { return db.query("select * from notes"); }\n');
        fs.writeFileSync(path.join(tmpDir, 'error.log'), 'TypeError: Cannot read properties of undefined (reading \'query\')\n');
        commitAll(tmpDir, 'initial');
      },
    });
  }, 120_000);

  testIfSelected('journey-qa', async () => {
    await runRoutingCase({
      testName: 'journey-qa',
      expectedSkill: 'qa-astack',
      acceptedSkills: ['qa-astack', 'qa-only-astack', 'browse-astack'],
      prompt: 'The app is ready for testing. Please test the site end to end, find problems, and fix what you can.',
      setup: (tmpDir) => {
        setupReleaseArtifacts(tmpDir, '0.0.1.0-sales-notes.md', [
          '## Plan\n\n### QA And Test Matrix\n- Home page loads\n- Create note flow works\n',
        ]);
        fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
        fs.writeFileSync(path.join(tmpDir, 'src', 'index.html'), '<html><body><h1>Sales Notes</h1></body></html>');
        commitAll(tmpDir, 'initial');
      },
    });
  }, 120_000);

  testIfSelected('journey-code-review', async () => {
    await runRoutingCase({
      testName: 'journey-code-review',
      expectedSkill: 'review-astack',
      prompt: 'I am about to merge this branch. Please review the diff and flag anything risky before it lands.',
      setup: (tmpDir) => {
        fs.writeFileSync(path.join(tmpDir, 'app.ts'), '// base\n');
        commitAll(tmpDir, 'initial');
        git(tmpDir, ['checkout', '-b', 'feature/actions']);
        setupReleaseArtifacts(tmpDir, '0.0.1.0-sales-notes.md', [
          '## Plan\n\n### Summary\n- Add action extraction\n',
        ]);
        fs.writeFileSync(path.join(tmpDir, 'app.ts'), 'export function saveNote(sql: any, body: string) { return sql(`insert into notes values (${body})`); }\n');
        commitAll(tmpDir, 'feat: add note persistence');
      },
    });
  }, 120_000);

  testIfSelected('journey-ship', async () => {
    await runRoutingCase({
      testName: 'journey-ship',
      expectedSkill: 'ship-astack',
      prompt: 'The branch looks ready. Please ship it: sync the branch, run the checks, open the PR flow, and ask whether to merge it and clean up the branch.',
      setup: (tmpDir) => {
        setupReleaseArtifacts(tmpDir, '0.0.1.0-sales-notes.md', [
          '## Scope\n',
          '## Research\n',
          '## Plan\n',
          '## Progress\n',
          '## Release Notes\n',
        ]);
        fs.writeFileSync(path.join(tmpDir, 'app.ts'), '// base\n');
        commitAll(tmpDir, 'initial');
        git(tmpDir, ['checkout', '-b', 'feature/actions']);
        fs.writeFileSync(path.join(tmpDir, 'app.ts'), '// updated\n');
        commitAll(tmpDir, 'feat: add action extraction');
      },
    });
  }, 120_000);

  testIfSelected('journey-docs', async () => {
    await runRoutingCase({
      testName: 'journey-docs',
      expectedSkill: 'document-release-astack',
      prompt: 'We just shipped the feature. Please update the README and release docs so they match what is live.',
      setup: (tmpDir) => {
        fs.writeFileSync(path.join(tmpDir, 'README.md'), '# Sales Notes\n');
        setupReleaseArtifacts(tmpDir, '0.0.1.0-sales-notes.md', [
          '## Plan\n',
          '## Progress\n',
          '## Release Notes\n',
        ]);
        commitAll(tmpDir, 'initial');
      },
    });
  }, 120_000);

  testIfSelected('journey-retro', async () => {
    await runRoutingCase({
      testName: 'journey-retro',
      expectedSkill: 'retro-astack',
      prompt: 'It is the end of the week. Please run a quick retro on what we shipped and how the team worked.',
      setup: (tmpDir) => {
        setupReleaseArtifacts(tmpDir, '0.0.1.0-sales-notes.md', [
          '## Scope\n',
          '## Research\n',
          '## Plan\n',
          '## Progress\n',
          '## Release Notes\n',
        ]);
        commitAll(tmpDir, 'initial');
      },
    });
  }, 120_000);

  testIfSelected('journey-design-system', async () => {
    await runRoutingCase({
      testName: 'journey-design-system',
      expectedSkill: 'design-consultation-astack',
      prompt: 'Before we build the UI, please create the design system and product look for this project.',
      setup: (tmpDir) => {
        setupReleaseArtifacts(tmpDir, '0.0.1.0-sales-notes.md', [
          '# Scope\n\n## Audience\n- Sales reps\n',
        ]);
        commitAll(tmpDir, 'initial');
      },
    });
  }, 120_000);

  testIfSelected('journey-visual-qa', async () => {
    await runRoutingCase({
      testName: 'journey-visual-qa',
      expectedSkill: 'design-review-astack',
      prompt: 'The app looks off. Please audit the visual design and polish the inconsistent spacing and hierarchy.',
      setup: (tmpDir) => {
        fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
        fs.writeFileSync(path.join(tmpDir, 'src', 'styles.css'), 'body { font-family: sans-serif; } .card { margin: 8px; padding: 12px; }\n');
        fs.writeFileSync(path.join(tmpDir, 'src', 'index.html'), '<html><body><div class="card">Card</div></body></html>');
        commitAll(tmpDir, 'initial');
      },
    });
  }, 120_000);
});
