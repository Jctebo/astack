import { describe, test, expect } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import { validateSkill } from './helpers/skill-parser';

const ROOT = path.resolve(import.meta.dir, '..');
const AGENTS_DIR = path.join(ROOT, '.agents', 'skills');

const ACTIVE_WORKFLOW_SKILLS = ['scope', 'research', 'plan', 'implement'] as const;
const RETAINED_SKILLS = [
  'browse',
  'qa',
  'qa-only',
  'review',
  'ship',
  'retro',
  'document-release',
  'design-consultation',
  'design-review',
  'investigate',
  'setup-browser-cookies',
  'careful',
  'freeze',
  'guard',
  'unfreeze',
  'astack-upgrade',
] as const;
const RETIRED_SKILLS = ['office-hours', 'plan-ceo-review', 'plan-eng-review', 'plan-design-review'] as const;
const ASTACK_BINARIES = [
  'astack-analytics',
  'astack-community-dashboard',
  'astack-config',
  'astack-diff-scope',
  'astack-review-log',
  'astack-review-read',
  'astack-slug',
  'astack-telemetry-log',
  'astack-telemetry-sync',
  'astack-update-check',
] as const;

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf-8');
}

describe('SKILL.md command validation', () => {
  const browseAwareSkills = [
    'SKILL.md',
    'browse/SKILL.md',
    'qa/SKILL.md',
    'qa-only/SKILL.md',
    'design-review/SKILL.md',
    'design-consultation/SKILL.md',
  ];

  for (const skillPath of browseAwareSkills) {
    test(`${skillPath} has valid $B commands and snapshot flags`, () => {
      const result = validateSkill(path.join(ROOT, skillPath));
      expect(result.invalid).toHaveLength(0);
      expect(result.snapshotFlagErrors).toHaveLength(0);
    });
  }
});

describe('astack workflow structure', () => {
  test('new workflow skills exist and retired planning skills are absent', () => {
    for (const skill of ACTIVE_WORKFLOW_SKILLS) {
      expect(fs.existsSync(path.join(ROOT, skill, 'SKILL.md'))).toBe(true);
      expect(fs.existsSync(path.join(ROOT, skill, 'SKILL.md.tmpl'))).toBe(true);
    }

    for (const retired of RETIRED_SKILLS) {
      expect(fs.existsSync(path.join(ROOT, retired))).toBe(false);
    }
  });

  test('new workflow descriptions advertise the correct artifact contract', () => {
    expect(read('scope/SKILL.md')).toContain('00-scope.md');
    expect(read('research/SKILL.md')).toContain('01-research.md');
    expect(read('plan/SKILL.md')).toContain('02-plan.md');
    expect(read('implement/SKILL.md')).toContain('03-progress.md');
  });

  test('root astack skill points to the new planning flow', () => {
    const content = read('SKILL.md');
    expect(content).toContain('/scope');
    expect(content).toContain('/research');
    expect(content).toContain('/plan');
    expect(content).toContain('/implement');
    expect(content).not.toContain('/office-hours');
    expect(content).not.toContain('/plan-ceo-review');
    expect(content).not.toContain('/plan-eng-review');
    expect(content).not.toContain('/plan-design-review');
  });

  test('review, qa, and ship read plan artifacts instead of hidden astack project files', () => {
    const review = read('review/SKILL.md');
    const qa = read('qa/SKILL.md');
    const qaOnly = read('qa-only/SKILL.md');
    const ship = read('ship/SKILL.md');

    expect(review).toContain('02-plan.md');
    expect(review).toContain('03-progress.md');

    expect(qa).toContain('02-plan.md');
    expect(qa).toContain('03-progress.md');
    expect(qaOnly).toContain('02-plan.md');
    expect(qaOnly).toContain('03-progress.md');

    expect(ship).toContain('00-scope.md');
    expect(ship).toContain('01-research.md');
    expect(ship).toContain('02-plan.md');
    expect(ship).toContain('03-progress.md');
  });
});

describe('generated skill health', () => {
  test('all active generated skills have headers and no unresolved placeholders', () => {
    const relativePaths = [
      'SKILL.md',
      ...ACTIVE_WORKFLOW_SKILLS.map((skill) => `${skill}/SKILL.md`),
      ...RETAINED_SKILLS.map((skill) => `${skill}/SKILL.md`),
    ];

    for (const relativePath of relativePaths) {
      const content = read(relativePath);
      expect(content).toContain('AUTO-GENERATED from SKILL.md.tmpl');
      expect(content.match(/\{\{[A-Z_]+\}\}/g)).toBeNull();
    }
  });

  test('setup script links astack skill roots for Claude and Codex', () => {
    const setup = read('setup');
    expect(setup).toContain('.agents/skills');
    expect(setup).toContain('link_claude_skill_dirs');
    expect(setup).toContain('link_codex_skill_dirs');
    expect(setup).toContain('$HOME/.codex/skills');
  });
});

describe('binary and install surface', () => {
  test('astack binaries exist and gstack binaries are gone', () => {
    for (const binary of ASTACK_BINARIES) {
      expect(fs.existsSync(path.join(ROOT, 'bin', binary))).toBe(true);
    }

    expect(fs.existsSync(path.join(ROOT, 'bin', 'gstack-config'))).toBe(false);
    expect(fs.existsSync(path.join(ROOT, 'bin', 'gstack-update-check'))).toBe(false);
    expect(fs.existsSync(path.join(ROOT, 'bin', 'gstack-review-read'))).toBe(false);
  });

  test('package metadata uses astack identity', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.name).toBe('astack');
    expect(pkg.scripts['gen:skill-docs']).toContain('gen-skill-docs.ts');
  });
});

describe('Codex sidecars', () => {
  test('codex output uses astack naming and has no active gstack entries', () => {
    const entries = fs.readdirSync(AGENTS_DIR);
    expect(entries).toContain('astack');
    expect(entries).toContain('astack-scope');
    expect(entries).toContain('astack-research');
    expect(entries).toContain('astack-plan');
    expect(entries).toContain('astack-implement');
    expect(entries.some((entry) => entry === 'gstack' || entry.startsWith('gstack-'))).toBe(false);
  });

  test('codex sidecars use codex paths instead of claude paths', () => {
    for (const skillName of ['astack-review', 'astack-ship', 'astack-plan', 'astack-implement']) {
      const content = fs.readFileSync(path.join(AGENTS_DIR, skillName, 'SKILL.md'), 'utf-8');
      expect(content).toContain('~/.codex/skills/astack');
      expect(content).not.toContain('~/.claude/skills/astack');
      expect(content).not.toContain('.claude/skills');
    }
  });
});
