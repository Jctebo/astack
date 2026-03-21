import { describe, test, expect } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import { COMMAND_DESCRIPTIONS } from '../browse/src/commands';
import { SNAPSHOT_FLAGS } from '../browse/src/snapshot';

const ROOT = path.resolve(import.meta.dir, '..');
const AGENTS_DIR = path.join(ROOT, '.agents', 'skills');
const WORKFLOW_SKILLS = ['scope', 'research', 'plan', 'implement'] as const;
const RETIRED_SKILLS = ['office-hours', 'plan-ceo-review', 'plan-eng-review', 'plan-design-review'] as const;
const BUN = process.execPath;

function discoverTemplates() {
  const skills: Array<{ dir: string; output: string }> = [{ dir: '.', output: 'SKILL.md' }];

  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    if (!fs.existsSync(path.join(ROOT, entry.name, 'SKILL.md.tmpl'))) continue;
    skills.push({ dir: entry.name, output: `${entry.name}/SKILL.md` });
  }

  return skills.sort((a, b) => a.output.localeCompare(b.output));
}

function discoverCodexSkills() {
  return fs.readdirSync(AGENTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => name === 'astack' || name.startsWith('astack-'))
    .sort();
}

const ALL_SKILLS = discoverTemplates();
const CODEX_SKILLS = discoverCodexSkills();

describe('gen-skill-docs', () => {
  test('root generated SKILL.md contains all browse command categories', () => {
    const content = fs.readFileSync(path.join(ROOT, 'SKILL.md'), 'utf-8');
    const categories = new Set(Object.values(COMMAND_DESCRIPTIONS).map((meta) => meta.category));
    for (const category of categories) {
      expect(content).toContain(`### ${category}`);
    }
  });

  test('root generated SKILL.md contains all browse commands and snapshot flags', () => {
    const content = fs.readFileSync(path.join(ROOT, 'SKILL.md'), 'utf-8');
    for (const [command, meta] of Object.entries(COMMAND_DESCRIPTIONS)) {
      const display = meta.usage || command;
      expect(content).toContain(display);
    }
    for (const flag of SNAPSHOT_FLAGS) {
      expect(content).toContain(flag.short);
      expect(content).toContain(flag.description);
    }
  });

  test('all generated skills have headers and no unresolved placeholders', () => {
    for (const skill of ALL_SKILLS) {
      const content = fs.readFileSync(path.join(ROOT, skill.output), 'utf-8');
      expect(content).toContain('AUTO-GENERATED from SKILL.md.tmpl');
      expect(content).toContain('Regenerate: bun run gen:skill-docs');
      expect(content.match(/\{\{[A-Z_]+\}\}/g)).toBeNull();
    }
  });

  test('astack workflow skills exist and retired planning skills are gone', () => {
    for (const skill of WORKFLOW_SKILLS) {
      expect(fs.existsSync(path.join(ROOT, skill, 'SKILL.md.tmpl'))).toBe(true);
      expect(fs.existsSync(path.join(ROOT, skill, 'SKILL.md'))).toBe(true);
    }

    for (const retired of RETIRED_SKILLS) {
      expect(fs.existsSync(path.join(ROOT, retired))).toBe(false);
    }
  });

  test('workflow skills write the canonical numbered artifacts', () => {
    const scopeContent = fs.readFileSync(path.join(ROOT, 'scope', 'SKILL.md'), 'utf-8');
    const researchContent = fs.readFileSync(path.join(ROOT, 'research', 'SKILL.md'), 'utf-8');
    const planContent = fs.readFileSync(path.join(ROOT, 'plan', 'SKILL.md'), 'utf-8');
    const implementContent = fs.readFileSync(path.join(ROOT, 'implement', 'SKILL.md'), 'utf-8');

    expect(scopeContent).toContain('00-scope.md');
    expect(researchContent).toContain('01-research.md');
    expect(planContent).toContain('02-plan.md');
    expect(implementContent).toContain('03-progress.md');
  });

  test('root skill suggests the new astack workflow', () => {
    const content = fs.readFileSync(path.join(ROOT, 'SKILL.md'), 'utf-8');
    expect(content).toContain('suggest /scope');
    expect(content).toContain('suggest /research');
    expect(content).toContain('suggest /plan');
    expect(content).toContain('suggest /implement');
  });

  test('review and ship align to plan artifacts', () => {
    const reviewContent = fs.readFileSync(path.join(ROOT, 'review', 'SKILL.md'), 'utf-8');
    const shipContent = fs.readFileSync(path.join(ROOT, 'ship', 'SKILL.md'), 'utf-8');

    expect(reviewContent).toContain('02-plan.md');
    expect(reviewContent).toContain('03-progress.md');

    expect(shipContent).toContain('PLAN AND REVIEW READINESS DASHBOARD');
    expect(shipContent).toContain('00-scope.md');
    expect(shipContent).toContain('01-research.md');
    expect(shipContent).toContain('02-plan.md');
    expect(shipContent).toContain('03-progress.md');
  });

  test('Claude dry-run freshness passes', () => {
    const result = Bun.spawnSync([BUN, 'run', 'scripts/gen-skill-docs.ts', '--dry-run'], {
      cwd: ROOT,
      stdout: 'pipe',
      stderr: 'pipe',
    });

    expect(result.exitCode).toBe(0);
    const output = result.stdout.toString().replaceAll('\\', '/');
    for (const skill of ALL_SKILLS) {
      expect(output).toContain(`FRESH: ${skill.output}`);
    }
    expect(output).not.toContain('STALE');
  });
});

describe('Codex generation (--host codex)', () => {
  test('codex output exists for root and astack workflow skills', () => {
    expect(fs.existsSync(path.join(AGENTS_DIR, 'astack', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(AGENTS_DIR, 'astack-scope', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(AGENTS_DIR, 'astack-research', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(AGENTS_DIR, 'astack-plan', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(AGENTS_DIR, 'astack-implement', 'SKILL.md'))).toBe(true);
  });

  test('active codex skills use astack names and contain no Claude paths', () => {
    for (const skillName of CODEX_SKILLS) {
      expect(skillName.startsWith('astack')).toBe(true);
      const content = fs.readFileSync(path.join(AGENTS_DIR, skillName, 'SKILL.md'), 'utf-8');
      expect(content).not.toContain('.claude/skills');
      expect(content).not.toContain('~/.claude/');
    }
  });

  test('no active gstack codex sidecars remain', () => {
    const activeEntries = fs.readdirSync(AGENTS_DIR);
    expect(activeEntries.some((entry) => entry === 'gstack' || entry.startsWith('gstack-'))).toBe(false);
  });

  test('Codex dry-run freshness passes', () => {
    const result = Bun.spawnSync([BUN, 'run', 'scripts/gen-skill-docs.ts', '--host', 'codex', '--dry-run'], {
      cwd: ROOT,
      stdout: 'pipe',
      stderr: 'pipe',
    });

    expect(result.exitCode).toBe(0);
    const output = result.stdout.toString().replaceAll('\\', '/');
    for (const skillName of CODEX_SKILLS) {
      expect(output).toContain(`FRESH: .agents/skills/${skillName}/SKILL.md`);
    }
    expect(output).not.toContain('STALE');
  });
});
