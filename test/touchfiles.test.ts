/**
 * Unit tests for diff-based test selection.
 */

import { describe, test, expect } from 'bun:test';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  matchGlob,
  selectTests,
  detectBaseBranch,
  E2E_TOUCHFILES,
  LLM_JUDGE_TOUCHFILES,
  GLOBAL_TOUCHFILES,
} from './helpers/touchfiles';

describe('matchGlob', () => {
  test('** matches any depth of path segments', () => {
    expect(matchGlob('browse/src/commands.ts', 'browse/src/**')).toBe(true);
    expect(matchGlob('browse/src/deep/nested/file.ts', 'browse/src/**')).toBe(true);
    expect(matchGlob('browse/src/cli.ts', 'browse/src/**')).toBe(true);
  });

  test('** does not match unrelated paths', () => {
    expect(matchGlob('browse/src/commands.ts', 'qa/**')).toBe(false);
    expect(matchGlob('review/SKILL.md', 'qa/**')).toBe(false);
  });

  test('exact match works', () => {
    expect(matchGlob('SKILL.md', 'SKILL.md')).toBe(true);
    expect(matchGlob('SKILL.md.tmpl', 'SKILL.md')).toBe(false);
    expect(matchGlob('qa/SKILL.md', 'SKILL.md')).toBe(false);
  });

  test('* matches within a single segment', () => {
    expect(matchGlob('test/fixtures/review-eval-enum.rb', 'test/fixtures/review-eval-enum*.rb')).toBe(true);
    expect(matchGlob('test/fixtures/review-eval-enum-diff.rb', 'test/fixtures/review-eval-enum*.rb')).toBe(true);
    expect(matchGlob('test/fixtures/review-eval-vuln.rb', 'test/fixtures/review-eval-enum*.rb')).toBe(false);
  });
});

describe('selectTests', () => {
  test('browse/src change selects browse and QA tests', () => {
    const result = selectTests(['browse/src/commands.ts'], E2E_TOUCHFILES);
    expect(result.selected).toContain('browse-basic');
    expect(result.selected).toContain('browse-snapshot');
    expect(result.selected).toContain('qa-quick');
    expect(result.selected).toContain('qa-fix-loop');
    expect(result.selected).toContain('design-review-fix');
    expect(result.selected).not.toContain('scope-artifact');
    expect(result.selected).not.toContain('retro');
    expect(result.reason).toBe('diff');
  });

  test('scope skill change selects scope-only artifact coverage', () => {
    const result = selectTests(['scope/SKILL.md'], E2E_TOUCHFILES);
    expect(result.selected).toContain('scope-artifact');
    expect(result.selected).not.toContain('research-artifact');
    expect(result.selected).not.toContain('plan-artifact');
  });

  test('plan skill change selects plan coverage and routing', () => {
    const result = selectTests(['plan/SKILL.md'], E2E_TOUCHFILES);
    expect(result.selected).toContain('plan-artifact');
    expect(result.selected).toContain('journey-plan');
    expect(result.selected).not.toContain('journey-scope');
  });

  test('multiple changed files union their selections', () => {
    const result = selectTests(['research/SKILL.md', 'retro/SKILL.md.tmpl'], E2E_TOUCHFILES);
    expect(result.selected).toContain('research-artifact');
    expect(result.selected).toContain('journey-research');
    expect(result.selected).toContain('retro');
    expect(result.selected).toContain('retro-base-branch');
  });

  test('global touchfile triggers all tests', () => {
    const result = selectTests(['test/helpers/session-runner.ts'], E2E_TOUCHFILES);
    expect(result.selected.length).toBe(Object.keys(E2E_TOUCHFILES).length);
    expect(result.skipped).toEqual([]);
    expect(result.reason).toContain('global');
  });

  test('global touchfiles also trigger all LLM-judge tests', () => {
    const result = selectTests(['scripts/gen-skill-docs.ts'], LLM_JUDGE_TOUCHFILES, GLOBAL_TOUCHFILES);
    expect(result.selected.length).toBe(Object.keys(LLM_JUDGE_TOUCHFILES).length);
  });

  test('LLM judge mapping follows astack workflow docs', () => {
    const result = selectTests(['plan/SKILL.md'], LLM_JUDGE_TOUCHFILES);
    expect(result.selected).toContain('plan/SKILL.md artifact');
    expect(result.selected).not.toContain('scope/SKILL.md artifact');
  });

  test('unrelated file selects nothing', () => {
    const result = selectTests(['README.md'], E2E_TOUCHFILES);
    expect(result.selected).toEqual([]);
    expect(result.skipped.length).toBe(Object.keys(E2E_TOUCHFILES).length);
  });
});

describe('detectBaseBranch', () => {
  test('detects local main or master branch', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'touchfiles-test-'));
    const run = (cmd: string, args: string[]) =>
      spawnSync(cmd, args, { cwd: dir, stdio: 'pipe', timeout: 5000 });

    run('git', ['init']);
    run('git', ['config', 'user.email', 'test@test.com']);
    run('git', ['config', 'user.name', 'Test']);
    fs.writeFileSync(path.join(dir, 'test.txt'), 'hello\n');
    run('git', ['add', '.']);
    run('git', ['commit', '-m', 'init']);

    const result = detectBaseBranch(dir);
    expect(result).toMatch(/^(main|master)$/);

    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('returns null for non-git directories', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'touchfiles-test-'));
    expect(detectBaseBranch(dir)).toBeNull();
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
