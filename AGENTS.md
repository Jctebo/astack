# astack - AI Engineering Workflow

astack is a set of SKILL.md-based workflows for AI-assisted software delivery.

## Available skills

Skills live in `.agents/skills/`. Invoke them by name.

| Skill | What it does |
|-------|--------------|
| `/scope` | Scope discovery and product framing. Writes `00-scope.md`. |
| `/research` | Repository and dependency research. Writes `01-research.md`. |
| `/plan` | Unified engineering and design planning. Writes `02-plan.md`. |
| `/implement` | Plan-driven implementation. Updates `03-progress.md`. |
| `/review` | Pre-landing PR review against the plan and diff. |
| `/investigate` | Systematic root-cause debugging. |
| `/design-consultation` | Create a design system from scratch. |
| `/design-review` | Live-site design audit and fix loop. |
| `/qa` | Browser QA plus fixes and re-verification. |
| `/qa-only` | Browser QA report without code changes. |
| `/ship` | Run checks, prepare release state, push, and open PRs. |
| `/document-release` | Sync project docs after shipping. |
| `/retro` | Retrospective based on git history and workflow artifacts. |
| `/browse` | Fast persistent browser automation. |
| `/setup-browser-cookies` | Import real browser cookies for authenticated testing. |
| `/codex` | Independent second opinion through Codex CLI. |
| `/careful` | Warn before destructive commands. |
| `/freeze` | Restrict edits to one directory. |
| `/guard` | Combine careful + freeze. |
| `/unfreeze` | Remove the edit restriction boundary. |
| `/astack-upgrade` | Upgrade astack from the astack fork source. |

## Build commands

```bash
bun install
bun test
bun run build
bun run gen:skill-docs
bun run gen:skill-docs --host codex
bun run skill:check
```

## Key conventions

- Edit `.tmpl` files, then regenerate the committed `SKILL.md` outputs.
- The numbered repo-root artifacts are the workflow source of truth:
  `00-scope.md`, `01-research.md`, `02-plan.md`, `03-progress.md`.
- `/review`, `/qa`, `/ship`, and `/document-release` should align with those
  artifacts instead of hidden sidecar planning files.
