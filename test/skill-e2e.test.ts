import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { startTestServer } from '../browse/test/test-server';
import { EvalCollector } from './helpers/eval-store';
import type { SkillTestResult } from './helpers/session-runner';
import { runSkillTest } from './helpers/session-runner';
import { detectBaseBranch, E2E_TOUCHFILES, getChangedFiles, GLOBAL_TOUCHFILES, selectTests } from './helpers/touchfiles';

const ROOT = path.resolve(import.meta.dir, '..');
const browseBin = path.resolve(ROOT, 'browse', 'dist', 'browse');
const evalsEnabled = !!process.env.EVALS;
const describeE2E = evalsEnabled ? describe : describe.skip;
const evalCollector = evalsEnabled ? new EvalCollector('e2e') : null;
const runId = new Date().toISOString().replace(/[:.]/g, '').replace('T', '-').slice(0, 15);

let selectedTests: string[] | null = null;
if (evalsEnabled && !process.env.EVALS_ALL) {
  const baseBranch = process.env.EVALS_BASE || detectBaseBranch(ROOT) || 'main';
  const changedFiles = getChangedFiles(baseBranch, ROOT);
  if (changedFiles.length > 0) {
    const selection = selectTests(changedFiles, E2E_TOUCHFILES, GLOBAL_TOUCHFILES);
    selectedTests = selection.selected;
    process.stderr.write(`\nE2E selection (${selection.reason}): ${selection.selected.length}/${Object.keys(E2E_TOUCHFILES).length} tests\n`);
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
  const skillDirs = ['', 'scope', 'research', 'plan', 'implement', 'browse'];
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

function setupBrowseShims(dir: string) {
  const binDir = path.join(dir, 'browse', 'dist');
  fs.mkdirSync(binDir, { recursive: true });
  if (fs.existsSync(browseBin)) {
    fs.symlinkSync(browseBin, path.join(binDir, 'browse'));
  }

  const findBrowseDir = path.join(dir, 'browse', 'bin');
  fs.mkdirSync(findBrowseDir, { recursive: true });
  fs.writeFileSync(path.join(findBrowseDir, 'find-browse'), `#!/bin/bash\necho "${browseBin}"\n`, { mode: 0o755 });
  fs.writeFileSync(path.join(findBrowseDir, 'remote-slug'), '#!/bin/bash\necho "test-project"\n', { mode: 0o755 });
}

function logCost(label: string, result: SkillTestResult) {
  const { estimatedCost, estimatedTokens, turnsUsed } = result.costEstimate;
  const durationSec = Math.round(result.duration / 1000);
  console.log(`${label}: $${estimatedCost.toFixed(2)} (${turnsUsed} turns, ${(estimatedTokens / 1000).toFixed(1)}k tokens, ${durationSec}s)`);
}

function recordE2E(name: string, suite: string, result: SkillTestResult) {
  evalCollector?.addTest({
    name,
    suite,
    tier: 'e2e',
    passed: result.exitReason === 'success' && result.browseErrors.length === 0,
    duration_ms: result.duration,
    cost_usd: result.costEstimate.estimatedCost,
    transcript: result.transcript,
    output: result.output?.slice(0, 2000),
    turns_used: result.costEstimate.turnsUsed,
    browse_errors: result.browseErrors,
    exit_reason: result.exitReason,
  });
}

let testServer: ReturnType<typeof startTestServer>;
let browseTmpDir: string;

describeE2E('Skill E2E tests', () => {
  beforeAll(() => {
    testServer = startTestServer();
    browseTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-e2e-browse-'));
    initGitRepo(browseTmpDir);
    installSkills(browseTmpDir);
    setupBrowseShims(browseTmpDir);
    commitAll(browseTmpDir, 'initial');
  });

  afterAll(() => {
    testServer?.server?.stop();
    try { fs.rmSync(browseTmpDir, { recursive: true, force: true }); } catch {}
    evalCollector?.finalize();
  });

  testIfSelected('browse-basic', async () => {
    const result = await runSkillTest({
      prompt: `You have a browse binary at ${browseBin}. Assign it to B and run:
1. $B goto ${testServer.url}
2. $B snapshot -i
3. $B text
4. $B screenshot /tmp/skill-e2e-test.png
Summarize what each command returned.`,
      workingDirectory: browseTmpDir,
      maxTurns: 8,
      timeout: 60_000,
      testName: 'browse-basic',
      runId,
    });

    logCost('browse-basic', result);
    recordE2E('browse-basic', 'Skill E2E tests', result);
    expect(result.exitReason).toBe('success');
    expect(result.browseErrors).toHaveLength(0);
  }, 90_000);

  testIfSelected('browse-snapshot', async () => {
    const result = await runSkillTest({
      prompt: `You have a browse binary at ${browseBin}. Assign it to B and run:
1. $B goto ${testServer.url}
2. $B snapshot -i
3. $B snapshot -D
4. $B snapshot -i -a -o /tmp/skill-e2e-annotated.png
Report the observed structure and whether the annotated screenshot was created.`,
      workingDirectory: browseTmpDir,
      maxTurns: 8,
      timeout: 60_000,
      testName: 'browse-snapshot',
      runId,
    });

    logCost('browse-snapshot', result);
    recordE2E('browse-snapshot', 'Skill E2E tests', result);
    expect(result.exitReason).toBe('success');
    expect(result.browseErrors).toHaveLength(0);
  }, 90_000);

  testIfSelected('scope-artifact', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scope-e2e-'));
    try {
      initGitRepo(tmpDir);
      installSkills(tmpDir);
      fs.writeFileSync(path.join(tmpDir, 'README.md'), '# Sales Notes\n');
      commitAll(tmpDir, 'initial');

      const result = await runSkillTest({
        prompt: 'Use /scope-astack. We are building an internal note summarizer for a 6-person sales team. Reps currently paste raw call notes into Slack, next steps get lost, and managers cannot see follow-ups. The first wedge should turn one call note into a short summary plus explicit next actions.',
        workingDirectory: tmpDir,
        maxTurns: 8,
        allowedTools: ['Skill', 'Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
        timeout: 90_000,
        testName: 'scope-artifact',
        runId,
      });

      logCost('scope-artifact', result);
      recordE2E('scope-artifact', 'Skill E2E tests', result);

      const artifact = fs.readFileSync(path.join(tmpDir, '00-scope.md'), 'utf-8');
      expect(artifact).toContain('# Scope');
      expect(artifact).toContain('## Problem');
      expect(artifact).toContain('## Narrow Wedge');
      expect(artifact).toContain('## Recommended Next Step');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }, 120_000);

  testIfSelected('research-artifact', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'research-e2e-'));
    try {
      initGitRepo(tmpDir);
      installSkills(tmpDir);
      fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, '00-scope.md'), '# Scope\n\n## Problem\n- Reps lose follow-ups.\n');
      fs.writeFileSync(path.join(tmpDir, 'src', 'notes.ts'), 'export function summarizeNotes(input: string) { return input.trim(); }\n');
      commitAll(tmpDir, 'initial');

      const result = await runSkillTest({
        prompt: 'Use /research-astack to map the repo and document what we can reuse before planning. Focus on how note summarization currently works and what constraints matter.',
        workingDirectory: tmpDir,
        maxTurns: 8,
        allowedTools: ['Skill', 'Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
        timeout: 90_000,
        testName: 'research-artifact',
        runId,
      });

      logCost('research-artifact', result);
      recordE2E('research-artifact', 'Skill E2E tests', result);

      const artifact = fs.readFileSync(path.join(tmpDir, '01-research.md'), 'utf-8');
      expect(artifact).toContain('# Research');
      expect(artifact).toContain('## Current System Map');
      expect(artifact).toContain('## Reuse Opportunities');
      expect(artifact).toContain('## Recommended Direction');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }, 120_000);

  testIfSelected('plan-artifact', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-e2e-'));
    try {
      initGitRepo(tmpDir);
      installSkills(tmpDir);
      fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, '00-scope.md'), '# Scope\n\n## Problem\n- Reps lose follow-ups.\n');
      fs.writeFileSync(path.join(tmpDir, '01-research.md'), '# Research\n\n## Recommended Direction\n- Extend note summarization into action extraction.\n');
      fs.writeFileSync(path.join(tmpDir, 'src', 'notes.ts'), 'export function summarizeNotes(input: string) { return input.trim(); }\n');
      commitAll(tmpDir, 'initial');

      const result = await runSkillTest({
        prompt: 'Use /plan-astack to create the final implementation plan for note summaries with action extraction.',
        workingDirectory: tmpDir,
        maxTurns: 8,
        allowedTools: ['Skill', 'Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
        timeout: 90_000,
        testName: 'plan-artifact',
        runId,
      });

      logCost('plan-artifact', result);
      recordE2E('plan-artifact', 'Skill E2E tests', result);

      const artifact = fs.readFileSync(path.join(tmpDir, '02-plan.md'), 'utf-8');
      expect(artifact).toContain('# Plan');
      expect(artifact).toContain('## Architecture');
      expect(artifact).toContain('## Implementation Outline');
      expect(artifact).toContain('## QA And Test Matrix');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }, 120_000);

  testIfSelected('implement-progress', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'implement-e2e-'));
    try {
      initGitRepo(tmpDir);
      installSkills(tmpDir);
      fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'sales-notes', scripts: { test: 'bun test' } }, null, 2));
      fs.writeFileSync(path.join(tmpDir, 'src', 'notes.ts'), 'export function summarizeNotes(input: string) { return { summary: input.trim(), actions: [] as string[] }; }\n');
      fs.writeFileSync(path.join(tmpDir, '02-plan.md'), `# Plan

## Summary
- Add action extraction to note summaries

## What Already Exists
- \`src/notes.ts\`

## Architecture
- A small utility returns \`summary\` and \`actions\`

## Implementation Outline
- Update \`src/notes.ts\`
- Add a simple regression test

## QA And Test Matrix
- A note with "follow up" yields one action item

## Not In Scope
- CRM sync
`);
      commitAll(tmpDir, 'initial');

      const result = await runSkillTest({
        prompt: 'Use /implement-astack to build the approved plan and keep progress updated.',
        workingDirectory: tmpDir,
        maxTurns: 10,
        allowedTools: ['Skill', 'Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
        timeout: 120_000,
        testName: 'implement-progress',
        runId,
      });

      logCost('implement-progress', result);
      recordE2E('implement-progress', 'Skill E2E tests', result);

      const progress = fs.readFileSync(path.join(tmpDir, '03-progress.md'), 'utf-8');
      expect(progress).toContain('# Progress');
      expect(progress).toContain('## Checklist');
      expect(progress).toContain('## Completed Work');
      expect(progress).toContain('## Verification');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }, 150_000);
});
