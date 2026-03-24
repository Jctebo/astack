# Host Support

This document records the stable host contract for astack. It replaces the
temporary implementation notes that previously lived under `enhancement/`.

## Supported hosts

| Host | Install root | Generated source in this repo | Current scope |
|------|--------------|-------------------------------|---------------|
| Claude Code | `~/.claude/skills/astack` | source skill folders such as `scope/`, `architecture/`, `plan/`, and `ship/` | Full astack skill set |
| Codex | `~/.codex/skills/astack` runtime root backed by the git checkout that ran `setup --host codex` | `.agents/skills/` | Full generated astack skill set |
| GitHub Copilot | `~/.copilot/skills/astack` | `.copilot/skills/` | Full astack skill set |

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

Copilot now ships the full astack skill surface that is generated from this
repository.

Installed Copilot skills:

- `/scope-astack`
- `/architecture-astack`
- `/research-astack`
- `/plan-astack`
- `/implement-astack`
- `/review-astack`
- `/qa-astack`
- `/qa-only-astack`
- `/ship-astack`
- `/document-release-astack`
- `/retro-astack`
- `/browse-astack`
- `/setup-browser-cookies-astack`
- `/design-consultation-astack`
- `/design-review-astack`
- `/investigate-astack`
- `/codex-astack`
- `/careful-astack`
- `/freeze-astack`
- `/guard-astack`
- `/unfreeze-astack`
- `/astack-upgrade-astack`
- `/end-to-end`

Not installed for Copilot yet:

- repo-scoped `.github/skills/` exports
- `.github/copilot-instructions.md`
- custom `.github/agents/` profiles

That boundary is now the same full workflow and support surface used across the
repo, with only host packaging differences left.

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
