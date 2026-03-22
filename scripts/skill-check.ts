#!/usr/bin/env bun
/**
 * skill:check - Health summary for generated SKILL.md files.
 *
 * Reports:
 *   - Browse command validation for active skills
 *   - Template coverage for active skills
 *   - Codex sidecar health
 *   - Copilot skill export health
 *   - Generator freshness for Claude, Codex, and Copilot outputs
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { validateSkill } from '../test/helpers/skill-parser';

const ROOT = path.resolve(import.meta.dir, '..');
const AGENTS_DIR = path.join(ROOT, '.agents', 'skills');
const COPILOT_DIR = path.join(ROOT, '.copilot', 'skills');

function discoverClaudeSkills(): string[] {
  const skills = ['SKILL.md'];

  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

    const skillPath = path.join(ROOT, entry.name, 'SKILL.md');
    if (fs.existsSync(skillPath)) {
      skills.push(path.join(entry.name, 'SKILL.md'));
    }
  }

  return skills.sort();
}

function discoverTemplates(): Array<{ tmpl: string; output: string }> {
  const templates = [{ tmpl: 'SKILL.md.tmpl', output: 'SKILL.md' }];

  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

    const tmplPath = path.join(ROOT, entry.name, 'SKILL.md.tmpl');
    if (fs.existsSync(tmplPath)) {
      templates.push({
        tmpl: path.join(entry.name, 'SKILL.md.tmpl'),
        output: path.join(entry.name, 'SKILL.md'),
      });
    }
  }

  return templates.sort((a, b) => a.output.localeCompare(b.output));
}

function discoverCodexSkills(): string[] {
  if (!fs.existsSync(AGENTS_DIR)) return [];

  return fs.readdirSync(AGENTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => fs.existsSync(path.join(AGENTS_DIR, name, 'SKILL.md')))
    .sort();
}

function discoverCopilotSkills(): string[] {
  if (!fs.existsSync(COPILOT_DIR)) return [];

  return fs.readdirSync(COPILOT_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => fs.existsSync(path.join(COPILOT_DIR, name, 'SKILL.md')))
    .sort();
}

const CLAUDE_SKILLS = discoverClaudeSkills();
const TEMPLATES = discoverTemplates();
const CODEX_SKILLS = discoverCodexSkills();
const COPILOT_SKILLS = discoverCopilotSkills();

let hasErrors = false;

console.log('  Skills:');
for (const file of CLAUDE_SKILLS) {
  const fullPath = path.join(ROOT, file);
  const result = validateSkill(fullPath);

  if (result.warnings.length > 0) {
    console.log(`  ⚠️  ${file.padEnd(30)} - ${result.warnings.join(', ')}`);
    continue;
  }

  if (result.invalid.length > 0 || result.snapshotFlagErrors.length > 0) {
    hasErrors = true;
    console.log(`  ❌ ${file.padEnd(30)} - ${result.valid.length} valid, ${result.invalid.length} invalid, ${result.snapshotFlagErrors.length} snapshot errors`);
    for (const invalid of result.invalid) {
      console.log(`      line ${invalid.line}: unknown command '${invalid.command}'`);
    }
    for (const snapshotError of result.snapshotFlagErrors) {
      console.log(`      line ${snapshotError.command.line}: ${snapshotError.error}`);
    }
    continue;
  }

  console.log(`  ✅ ${file.padEnd(30)} - ${result.valid.length} commands, all valid`);
}

console.log('\n  Templates:');
for (const { tmpl, output } of TEMPLATES) {
  const tmplPath = path.join(ROOT, tmpl);
  const outputPath = path.join(ROOT, output);
  if (!fs.existsSync(tmplPath)) {
    hasErrors = true;
    console.log(`  ❌ ${output.padEnd(30)} - template missing`);
    continue;
  }
  if (!fs.existsSync(outputPath)) {
    hasErrors = true;
    console.log(`  ❌ ${output.padEnd(30)} - generated file missing`);
    continue;
  }
  console.log(`  ✅ ${tmpl.padEnd(30)} -> ${output}`);
}

console.log('\n  Codex Skills (.agents/skills/):');
if (CODEX_SKILLS.length === 0) {
  hasErrors = true;
  console.log('  ❌ No Codex skills found. Run: bun run gen:skill-docs --host codex');
} else {
  for (const skillName of CODEX_SKILLS) {
    const skillPath = path.join(AGENTS_DIR, skillName, 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      hasErrors = true;
      console.log(`  ❌ ${skillName.padEnd(30)} - SKILL.md missing`);
      continue;
    }

    const content = fs.readFileSync(skillPath, 'utf-8');
    if (content.includes('.claude/skills')) {
      hasErrors = true;
      console.log(`  ❌ ${skillName.padEnd(30)} - contains .claude/skills reference`);
      continue;
    }

    console.log(`  ✅ ${skillName.padEnd(30)} - OK`);
  }
}

console.log('\n  Copilot Skills (.copilot/skills/):');
if (COPILOT_SKILLS.length === 0) {
  hasErrors = true;
  console.log('  ❌ No Copilot skills found. Run: bun run gen:skill-docs --host copilot');
} else {
  for (const skillName of COPILOT_SKILLS) {
    const skillPath = path.join(COPILOT_DIR, skillName, 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      hasErrors = true;
      console.log(`  ❌ ${skillName.padEnd(30)} - SKILL.md missing`);
      continue;
    }

    const content = fs.readFileSync(skillPath, 'utf-8');
    if (content.includes('.claude/skills') || content.includes('~/.claude/')) {
      hasErrors = true;
      console.log(`  ❌ ${skillName.padEnd(30)} - contains Claude path reference`);
      continue;
    }

    console.log(`  ✅ ${skillName.padEnd(30)} - OK`);
  }
}

console.log('\n  Freshness (Claude):');
try {
  execSync('bun run scripts/gen-skill-docs.ts --dry-run', { cwd: ROOT, stdio: 'pipe' });
  console.log('  ✅ All Claude generated files are fresh');
} catch (error: any) {
  hasErrors = true;
  const output = error.stdout?.toString() || '';
  console.log('  ❌ Claude generated files are stale:');
  for (const line of output.split('\n').filter((value: string) => value.startsWith('STALE'))) {
    console.log(`      ${line}`);
  }
  console.log('      Run: bun run gen:skill-docs');
}

console.log('\n  Freshness (Codex):');
try {
  execSync('bun run scripts/gen-skill-docs.ts --host codex --dry-run', { cwd: ROOT, stdio: 'pipe' });
  console.log('  ✅ All Codex generated files are fresh');
} catch (error: any) {
  hasErrors = true;
  const output = error.stdout?.toString() || '';
  console.log('  ❌ Codex generated files are stale:');
  for (const line of output.split('\n').filter((value: string) => value.startsWith('STALE'))) {
    console.log(`      ${line}`);
  }
  console.log('      Run: bun run gen:skill-docs --host codex');
}

console.log('\n  Freshness (Copilot):');
try {
  execSync('bun run scripts/gen-skill-docs.ts --host copilot --dry-run', { cwd: ROOT, stdio: 'pipe' });
  console.log('  ✅ All Copilot generated files are fresh');
} catch (error: any) {
  hasErrors = true;
  const output = error.stdout?.toString() || '';
  console.log('  ❌ Copilot generated files are stale:');
  for (const line of output.split('\n').filter((value: string) => value.startsWith('STALE'))) {
    console.log(`      ${line}`);
  }
  console.log('      Run: bun run gen:skill-docs --host copilot');
}

console.log('');
process.exit(hasErrors ? 1 : 0);
