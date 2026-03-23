# astack - AI Engineering Workflow

astack is a set of SKILL.md-based workflows for AI-assisted software delivery.

## Available skills

Skills live in `.agents/skills/`. Invoke them by name.

GitHub Copilot support is also available as a system-level install in
`~/.copilot/skills`, currently limited to `/scope-astack`, `/research-astack`, `/plan-astack`, and
`/implement-astack`.

| Skill | What it does |
|-------|--------------|
| `/scope-astack` | Scope discovery and product framing. Updates the `Scope` section in the active release artifact and auto-branches from `main` when needed. |
| `/research-astack` | Repository and dependency research. Updates the `Research` section in the active release artifact. |
| `/plan-astack` | Unified engineering and design planning. Updates the `Plan` section in the active release artifact. |
| `/implement-astack` | Plan-driven implementation. Updates the `Progress` section in the active release artifact. |
| `/review-astack` | Pre-landing PR review against the plan and diff. |
| `/investigate-astack` | Systematic root-cause debugging. |
| `/design-consultation-astack` | Create a design system from scratch. |
| `/design-review-astack` | Live-site design audit and fix loop. |
| `/qa-astack` | Browser QA plus fixes and re-verification. |
| `/qa-only-astack` | Browser QA report without code changes. |
| `/ship-astack` | Run checks, prepare release state, push, open PRs, ask whether to merge, and clean up the branch if approved. |
| `/document-release-astack` | Sync project docs after shipping. |
| `/retro-astack` | Retrospective based on git history and workflow artifacts. |
| `/browse-astack` | Fast persistent browser automation. |
| `/setup-browser-cookies-astack` | Import real browser cookies for authenticated testing. |
| `/codex-astack` | Independent second opinion through Codex CLI. |
| `/careful-astack` | Warn before destructive commands. |
| `/freeze-astack` | Restrict edits to one directory. |
| `/guard-astack` | Combine careful + freeze. |
| `/unfreeze-astack` | Remove the edit restriction boundary. |
| `/astack-upgrade-astack` | Upgrade astack from the astack fork source. |

## Build commands

```bash
bun install
bun test
bun run build
bun run gen:skill-docs
bun run gen:skill-docs --host codex
bun run gen:skill-docs --host copilot
bun run skill:check
```

## Key conventions

- Edit `.tmpl` files, then regenerate the committed `SKILL.md` outputs.
- The release-folder artifacts are the workflow source of truth:
  `docs/releases/VERSION`, `docs/releases/RELEASE_LOG.md`, and
  `docs/releases/<version>-<slug>.md`.
- `/review-astack`, `/qa-astack`, `/ship-astack`, and `/document-release-astack` should align with the
  active release artifact instead of hidden sidecar planning files.
- Durable host behavior belongs in `docs/host-support.md`, not ad hoc workflow folders under `enhancement/`.
- The `end-to-end` enhancement is the unattended workflow path: it should sequence scope through ship while still stopping for human decisions or non-transient failures.
