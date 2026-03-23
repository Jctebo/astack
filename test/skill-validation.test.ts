import { describe, test, expect } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import { validateSkill } from './helpers/skill-parser';

const ROOT = path.resolve(import.meta.dir, '..');
const AGENTS_DIR = path.join(ROOT, '.agents', 'skills');

const ACTIVE_WORKFLOW_SKILLS = ['scope', 'architecture', 'research', 'plan', 'implement'] as const;
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
    expect(read('scope/SKILL.md')).toContain('docs/releases/');
    expect(read('architecture/SKILL.md')).toContain('docs/architecture/');
    expect(read('research/SKILL.md')).toContain('Research');
    expect(read('plan/SKILL.md')).toContain('Plan');
    expect(read('implement/SKILL.md')).toContain('Progress');
  });

  test('workflow docs mention branch bootstrap and merge cleanup', () => {
    expect(read('scope/SKILL.md')).toContain('enhancement/<slug>');
    expect(read('research/SKILL.md')).toContain('enhancement/<slug>');
    expect(read('plan/SKILL.md')).toContain('enhancement/<slug>');
    expect(read('implement/SKILL.md')).toContain('enhancement/<slug>');
    expect(read('ship/SKILL.md')).toContain('gh pr merge --merge --delete-branch');
    expect(read('ship/SKILL.md')).toContain('Step 8.6: Final merge decision');
  });

  test('root astack skill points to the new planning flow', () => {
    const content = read('SKILL.md');
    expect(content).toContain('/scope-astack');
    expect(content).toContain('/architecture-astack');
    expect(content).toContain('/research-astack');
    expect(content).toContain('/plan-astack');
    expect(content).toContain('/implement-astack');
    expect(content).not.toContain('/office-hours');
    expect(content).not.toContain('/plan-ceo-review');
    expect(content).not.toContain('/plan-eng-review');
    expect(content).not.toContain('/plan-design-review');
  });

  test('review, qa, and ship read release artifacts instead of hidden astack project files', () => {
    const review = read('review/SKILL.md');
    const qa = read('qa/SKILL.md');
    const qaOnly = read('qa-only/SKILL.md');
    const ship = read('ship/SKILL.md');

    expect(review).toContain('Plan');
    expect(review).toContain('Progress');

    expect(qa).toContain('docs/releases/');
    expect(qa).toContain('Progress');
    expect(qaOnly).toContain('docs/releases/');
    expect(qaOnly).toContain('Progress');

    expect(ship).toContain('docs/releases/VERSION');
    expect(ship).toContain('docs/releases/RELEASE_LOG.md');
    expect(ship).toContain('docs/releases/<version>-<slug>.md');
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
    expect(setup).toContain('.copilot/skills');
    expect(setup).toContain('link_claude_skill_dirs');
    expect(setup).toContain('link_codex_skill_dirs');
    expect(setup).toContain('link_copilot_skill_dirs');
    expect(setup).toContain('create_runtime_root');
    expect(setup).toContain('$HOME/.codex/skills');
    expect(setup).toContain('$HOME/.copilot/skills');
    expect(setup).toContain('.astack-source-path');
    expect(setup).toContain('cp "$ASTACK_DIR/docs/releases/VERSION" "$target_root/docs/releases/VERSION"');
    expect(setup).toContain('cp "$ASTACK_DIR/docs/releases/RELEASE_LOG.md" "$target_root/docs/releases/RELEASE_LOG.md"');
    expect(setup).not.toContain('ln -snf "$ASTACK_DIR" "$CODEX_ASTACK"');
  });

  test('upgrade skill resolves Codex source checkout instead of treating .agents as primary install', () => {
    const upgrade = read('.agents/skills/astack-upgrade-astack/SKILL.md');
    expect(upgrade).toContain('.astack-source-path');
    expect(upgrade).toContain('Source dir: ${SOURCE_DIR:-none}');
    expect(upgrade).toContain('$HOME/.codex/skills/astack');
    expect(upgrade).not.toContain('INSTALL_TYPE="global-git"');
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
    expect(entries).toContain('scope-astack');
    expect(entries).toContain('architecture-astack');
    expect(entries).toContain('research-astack');
    expect(entries).toContain('plan-astack');
    expect(entries).toContain('implement-astack');
    expect(entries.some((entry) => entry === 'gstack' || entry.startsWith('gstack-'))).toBe(false);
  });

  test('codex sidecars use codex paths instead of claude paths', () => {
    for (const skillName of ['review-astack', 'ship-astack', 'plan-astack', 'implement-astack']) {
      const content = fs.readFileSync(path.join(AGENTS_DIR, skillName, 'SKILL.md'), 'utf-8');
      expect(content).toContain('~/.codex/skills/astack');
      expect(content).toContain('~/.codex/skills/astack-upgrade/SKILL.md');
      expect(content).not.toContain('~/.codex/skills/astack/astack-upgrade/SKILL.md');
      expect(content).not.toContain('~/.claude/skills/astack');
      expect(content).not.toContain('.claude/skills');
    }
  });
});
