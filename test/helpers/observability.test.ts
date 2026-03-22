/**
 * Unit tests for E2E observability infrastructure.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { HeartbeatData, PartialData } from '../../scripts/eval-watch';
import { renderDashboard } from '../../scripts/eval-watch';
import { EvalCollector } from './eval-store';
import { sanitizeTestName } from './session-runner';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'obs-test-'));
});

afterEach(() => {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
});

describe('session-runner observability', () => {
  test('sanitizeTestName strips slashes and leading dashes', () => {
    expect(sanitizeTestName('/scope-astack')).toBe('scope-astack');
    expect(sanitizeTestName('scope-artifact')).toBe('scope-artifact');
    expect(sanitizeTestName('/qa-astack/deep/test')).toBe('qa-astack-deep-test');
    expect(sanitizeTestName('///leading')).toBe('leading');
  });

  test('heartbeat file path uses ~/.astack-dev/e2e-live.json', () => {
    const expected = path.join(os.homedir(), '.astack-dev', 'e2e-live.json');
    const sessionRunnerSrc = fs.readFileSync(path.resolve(__dirname, 'session-runner.ts'), 'utf-8');

    expect(expected).toContain(path.join('.astack-dev', 'e2e-live.json'));
    expect(sessionRunnerSrc).toContain("'e2e-live.json'");
    expect(sessionRunnerSrc).toContain('atomicWriteSync');
  });

  test('heartbeat JSON schema has expected fields', () => {
    const src = fs.readFileSync(path.resolve(__dirname, 'session-runner.ts'), 'utf-8');
    for (const field of ['runId', 'startedAt', 'currentTest', 'status', 'turn', 'toolCount', 'lastTool', 'lastToolAt', 'elapsedSec']) {
      expect(src).toContain(field);
    }
    expect(src).not.toContain('completedTests');
  });

  test('progress.log and NDJSON persistence hooks are present', () => {
    const src = fs.readFileSync(path.resolve(__dirname, 'session-runner.ts'), 'utf-8');
    expect(src).toContain('progressLine');
    expect(src).toContain("'progress.log'");
    expect(src).toContain('.ndjson');
    expect(src).toContain('appendFileSync');
  });

  test('failure transcript falls back safely when runDir is missing', () => {
    const src = fs.readFileSync(path.resolve(__dirname, 'session-runner.ts'), 'utf-8');
    expect(src).toContain('runDir || path.join(workingDirectory');
    expect(src).toContain('-failure.json');
  });
});

describe('eval-store observability', () => {
  test('savePartial() writes valid JSON with _partial: true', () => {
    const evalDir = path.join(tmpDir, 'evals');
    const collector = new EvalCollector('e2e', evalDir);

    collector.addTest({
      name: 'scope-artifact',
      suite: 'astack workflow',
      tier: 'e2e',
      passed: true,
      duration_ms: 1000,
      cost_usd: 0.05,
      exit_reason: 'success',
    });

    const partialPath = path.join(evalDir, '_partial-e2e.json');
    expect(fs.existsSync(partialPath)).toBe(true);

    const partial = JSON.parse(fs.readFileSync(partialPath, 'utf-8'));
    expect(partial._partial).toBe(true);
    expect(partial.tests).toHaveLength(1);
    expect(partial.tests[0].name).toBe('scope-artifact');
    expect(partial.tests[0].exit_reason).toBe('success');
    expect(partial.total_tests).toBe(1);
    expect(partial.passed).toBe(1);
  });

  test('savePartial() accumulates multiple tests', () => {
    const evalDir = path.join(tmpDir, 'evals');
    const collector = new EvalCollector('e2e', evalDir);

    collector.addTest({
      name: 'scope-artifact',
      suite: 'astack workflow',
      tier: 'e2e',
      passed: true,
      duration_ms: 1000,
      cost_usd: 0.05,
    });

    collector.addTest({
      name: 'plan-artifact',
      suite: 'astack workflow',
      tier: 'e2e',
      passed: false,
      duration_ms: 2000,
      cost_usd: 0.1,
      exit_reason: 'timeout',
      timeout_at_turn: 5,
      last_tool_call: 'Write(02-plan.md)',
    });

    const partial = JSON.parse(fs.readFileSync(path.join(evalDir, '_partial-e2e.json'), 'utf-8'));
    expect(partial.tests).toHaveLength(2);
    expect(partial.total_tests).toBe(2);
    expect(partial.passed).toBe(1);
    expect(partial.failed).toBe(1);
    expect(partial.tests[1].exit_reason).toBe('timeout');
    expect(partial.tests[1].last_tool_call).toBe('Write(02-plan.md)');
  });

  test('finalize() preserves partial file alongside final output', async () => {
    const evalDir = path.join(tmpDir, 'evals');
    const collector = new EvalCollector('e2e', evalDir);

    collector.addTest({
      name: 'research-artifact',
      suite: 'astack workflow',
      tier: 'e2e',
      passed: true,
      duration_ms: 1000,
      cost_usd: 0.05,
    });

    const partialPath = path.join(evalDir, '_partial-e2e.json');
    await collector.finalize();

    expect(fs.existsSync(partialPath)).toBe(true);
    const finalFiles = fs.readdirSync(evalDir).filter((file) => file.endsWith('.json') && !file.startsWith('_'));
    expect(finalFiles.length).toBeGreaterThanOrEqual(1);
  });
});

describe('eval-watch dashboard', () => {
  test('renderDashboard shows completed tests and current test', () => {
    const heartbeat: HeartbeatData = {
      runId: '20260321-173000',
      startedAt: '2026-03-21T17:30:00Z',
      currentTest: 'plan-artifact',
      status: 'running',
      turn: 4,
      toolCount: 3,
      lastTool: 'Write(02-plan.md)',
      lastToolAt: new Date().toISOString(),
      elapsedSec: 285,
    };

    const partial: PartialData = {
      tests: [
        { name: 'scope-artifact', passed: true, cost_usd: 0.07, duration_ms: 24000, turns_used: 6 },
        { name: 'research-artifact', passed: true, cost_usd: 0.11, duration_ms: 42000, turns_used: 9 },
      ],
      total_cost_usd: 0.18,
      _partial: true,
    };

    const output = renderDashboard(heartbeat, partial);
    expect(output).toContain('20260321-173000');
    expect(output).toContain('scope-artifact');
    expect(output).toContain('research-artifact');
    expect(output).toContain('plan-artifact');
    expect(output).toContain('turn 4');
    expect(output).toContain('Write(02-plan.md)');
    expect(output).not.toContain('STALE');
  });

  test('renderDashboard warns on stale heartbeat', () => {
    const staleTime = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const heartbeat: HeartbeatData = {
      runId: '20260321-173000',
      startedAt: '2026-03-21T17:30:00Z',
      currentTest: 'implement-progress',
      status: 'running',
      turn: 4,
      toolCount: 3,
      lastTool: 'Edit(src/greeting.ts)',
      lastToolAt: staleTime,
      elapsedSec: 900,
    };

    const output = renderDashboard(heartbeat, null);
    expect(output).toContain('STALE');
    expect(output).toContain('may have crashed');
  });

  test('renderDashboard handles no active run', () => {
    const output = renderDashboard(null, null);
    expect(output).toContain('No active run');
    expect(output).toContain('bun test');
  });
});
