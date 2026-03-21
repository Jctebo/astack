/**
 * LLM-as-a-judge evals for generated SKILL.md quality.
 */

import { afterAll, describe, expect, test } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import { EvalCollector } from './helpers/eval-store';
import { judge } from './helpers/llm-judge';
import { detectBaseBranch, GLOBAL_TOUCHFILES, getChangedFiles, LLM_JUDGE_TOUCHFILES, selectTests } from './helpers/touchfiles';

const ROOT = path.resolve(import.meta.dir, '..');
const evalsEnabled = !!process.env.EVALS;
const describeEval = evalsEnabled ? describe : describe.skip;
const evalCollector = evalsEnabled ? new EvalCollector('llm-judge') : null;

let selectedTests: string[] | null = null;
if (evalsEnabled && !process.env.EVALS_ALL) {
  const baseBranch = process.env.EVALS_BASE || detectBaseBranch(ROOT) || 'main';
  const changedFiles = getChangedFiles(baseBranch, ROOT);
  if (changedFiles.length > 0) {
    const selection = selectTests(changedFiles, LLM_JUDGE_TOUCHFILES, GLOBAL_TOUCHFILES);
    selectedTests = selection.selected;
    process.stderr.write(`\nLLM-judge selection (${selection.reason}): ${selection.selected.length}/${Object.keys(LLM_JUDGE_TOUCHFILES).length} tests\n`);
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

async function judgeSection(options: {
  testName: string;
  suite: string;
  section: string;
  minClarity?: number;
  minCompleteness?: number;
  minActionability?: number;
}) {
  const t0 = Date.now();
  const scores = await judge(options.testName, options.section);

  evalCollector?.addTest({
    name: options.testName,
    suite: options.suite,
    tier: 'llm-judge',
    passed:
      scores.clarity >= (options.minClarity ?? 4) &&
      scores.completeness >= (options.minCompleteness ?? 4) &&
      scores.actionability >= (options.minActionability ?? 4),
    duration_ms: Date.now() - t0,
    cost_usd: 0.02,
    judge_scores: {
      clarity: scores.clarity,
      completeness: scores.completeness,
      actionability: scores.actionability,
    },
    judge_reasoning: scores.reasoning,
  });

  expect(scores.clarity).toBeGreaterThanOrEqual(options.minClarity ?? 4);
  expect(scores.completeness).toBeGreaterThanOrEqual(options.minCompleteness ?? 4);
  expect(scores.actionability).toBeGreaterThanOrEqual(options.minActionability ?? 4);
}

describeEval('LLM-as-judge quality evals', () => {
  afterAll(() => {
    evalCollector?.finalize();
  });

  testIfSelected('command reference table', async () => {
    const content = fs.readFileSync(path.join(ROOT, 'SKILL.md'), 'utf-8');
    const start = content.indexOf('## Command Reference');
    const end = content.indexOf('## Tips');
    await judgeSection({
      testName: 'command reference table',
      suite: 'LLM-as-judge quality evals',
      section: content.slice(start, end),
    });
  }, 30_000);

  testIfSelected('snapshot flags reference', async () => {
    const content = fs.readFileSync(path.join(ROOT, 'SKILL.md'), 'utf-8');
    const start = content.indexOf('## Snapshot System');
    const end = content.indexOf('## Command Reference');
    await judgeSection({
      testName: 'snapshot flags reference',
      suite: 'LLM-as-judge quality evals',
      section: content.slice(start, end),
    });
  }, 30_000);

  testIfSelected('browse/SKILL.md reference', async () => {
    const content = fs.readFileSync(path.join(ROOT, 'browse', 'SKILL.md'), 'utf-8');
    const start = content.indexOf('## Snapshot Flags');
    await judgeSection({
      testName: 'browse/SKILL.md reference',
      suite: 'LLM-as-judge quality evals',
      section: content.slice(start),
    });
  }, 30_000);

  testIfSelected('scope/SKILL.md artifact', async () => {
    await judgeSection({
      testName: 'scope/SKILL.md artifact',
      suite: 'LLM-as-judge astack workflow',
      section: fs.readFileSync(path.join(ROOT, 'scope', 'SKILL.md'), 'utf-8'),
    });
  }, 30_000);

  testIfSelected('research/SKILL.md artifact', async () => {
    await judgeSection({
      testName: 'research/SKILL.md artifact',
      suite: 'LLM-as-judge astack workflow',
      section: fs.readFileSync(path.join(ROOT, 'research', 'SKILL.md'), 'utf-8'),
    });
  }, 30_000);

  testIfSelected('plan/SKILL.md artifact', async () => {
    await judgeSection({
      testName: 'plan/SKILL.md artifact',
      suite: 'LLM-as-judge astack workflow',
      section: fs.readFileSync(path.join(ROOT, 'plan', 'SKILL.md'), 'utf-8'),
    });
  }, 30_000);

  testIfSelected('implement/SKILL.md progress', async () => {
    await judgeSection({
      testName: 'implement/SKILL.md progress',
      suite: 'LLM-as-judge astack workflow',
      section: fs.readFileSync(path.join(ROOT, 'implement', 'SKILL.md'), 'utf-8'),
    });
  }, 30_000);

  testIfSelected('ship/SKILL.md workflow', async () => {
    await judgeSection({
      testName: 'ship/SKILL.md workflow',
      suite: 'LLM-as-judge retained skills',
      section: fs.readFileSync(path.join(ROOT, 'ship', 'SKILL.md'), 'utf-8'),
      minClarity: 3,
      minCompleteness: 3,
      minActionability: 3,
    });
  }, 30_000);
});
