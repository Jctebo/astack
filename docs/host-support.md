# Host Support

This document records the stable host contract for astack. It replaces the
temporary implementation notes that previously lived under `enhancement/`.

## Supported hosts

| Host | Install root | Generated source in this repo | Current scope |
|------|--------------|-------------------------------|---------------|
| Claude Code | `~/.claude/skills/astack` | source skill folders such as `scope/`, `plan/`, and `ship/` | Full astack skill set |
| Codex | `~/.codex/skills/astack` runtime root backed by the git checkout that ran `setup --host codex` | `.agents/skills/` | Full generated astack skill set |
| GitHub Copilot | `~/.copilot/skills/astack` | `.copilot/skills/` | Base planning workflow plus `/end-to-end` |

## Canonical naming

astack's host-visible skill names come from each skill's canonical `name:`
value, not from the source folder name.

Examples:

- source folder: `plan/`
- canonical skill name: `plan-astack`
- generated Codex folder: `.agents/skills/plan-astack/`
- generated Copilot folder: `.copilot/skills/plan-astack/`

The root runtime skill remains `astack` for every host. Non-root generated
skills use the canonical `*-astack` names so command discovery matches the
documented commands users invoke.

## Generated output rules

- Edit `.tmpl` files and regenerate committed `SKILL.md` outputs.
- Claude output stays folder-based in the source tree.
- Codex and Copilot outputs are generated into host-specific sidecar folders
  named after the canonical skill `name:`.
- `setup` installs generated host folders by their actual basename and cleans up
  stale legacy `astack-*` sidecars when needed.
- Codex runtime roots also record the source checkout path that upgrades should
  use instead of guessing from repo-local `.agents/skills/astack` copies.
- Runtime roots carry release metadata under `docs/releases/` so update checks,
  upgrade summaries, and telemetry all read the same canonical version and
  release log files.

## GitHub Copilot support boundary

Copilot support is intentionally smaller than Claude and Codex today.

Installed Copilot skills:

- `/scope-astack`
- `/research-astack`
- `/plan-astack`
- `/implement-astack`
- `/end-to-end`

Not installed for Copilot yet:

- operational skills such as `/ship-astack`, `/qa-astack`, and `/review-astack`
- repo-scoped `.github/skills/` exports
- `.github/copilot-instructions.md`
- custom `.github/agents/` profiles

That boundary is deliberate. The planning workflow is the stable v1 Copilot
surface; broader parity can be added later once discovery and UX are validated.

## Verification expectations

Whenever host-facing skill docs change:

```bash
bun run gen:skill-docs
bun run gen:skill-docs --host codex
bun run gen:skill-docs --host copilot
bun run skill:check
```

If install behavior changed, also run the relevant setup flow and confirm the
expected files exist under the matching user-home skill directory.
