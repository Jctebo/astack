# astack development

## Commands

```bash
bun install
bun test
bun run test:evals
bun run test:e2e
bun run build
bun run gen:skill-docs
bun run gen:skill-docs --host codex
bun run gen:skill-docs --host copilot
bun run skill:check
bun run dev <cmd>
```

`test:evals` requires the relevant external auth for the eval runners.

On Windows, `setup` requires Node.js in addition to Bun because Playwright
verification uses Node there.

## Project structure

```text
astack/
├── browse/                 # Headless browser runtime, CLI, and tests
├── scope/                  # /scope skill
├── research/               # /research skill
├── plan/                   # /plan skill
├── implement/              # /implement skill
├── review/                 # /review skill
├── qa/                     # /qa skill
├── qa-only/                # /qa-only skill
├── ship/                   # /ship skill
├── document-release/       # /document-release skill
├── retro/                  # /retro skill
├── design-consultation/    # /design-consultation skill
├── design-review/          # /design-review skill
├── investigate/            # /investigate skill
├── careful/                # /careful skill
├── freeze/                 # /freeze skill
├── guard/                  # /guard skill
├── unfreeze/               # /unfreeze skill
├── astack-upgrade/         # /astack-upgrade skill
├── scripts/                # generators, analytics, DX tooling
├── test/                   # validation, routing, eval, and harness tests
├── .agents/skills/         # generated Codex-style sidecar skills
├── SKILL.md.tmpl           # root skill template
└── setup                   # install + registration entrypoint
```

## Workflow artifacts

astack uses four canonical repo-root artifacts:

- `00-scope.md`
- `01-research.md`
- `02-plan.md`
- `03-progress.md`

These replace the older hidden planning files under `~/.astack/projects/` for
the main implementation lifecycle. Skills that plan, review, QA, and ship
should treat them as the source of truth.

Host-specific install and naming rules live in `docs/host-support.md`.

## Template workflow

SKILL docs are generated.

1. Edit the relevant `.tmpl` file.
2. Run `bun run gen:skill-docs`.
3. Run `bun run gen:skill-docs --host codex`.
4. Commit both template and generated outputs.

## Platform-agnostic rules

- Never hardcode framework-specific commands when the repo can be inspected.
- Read project instructions before asking for missing conventions.
- Persist reusable project-specific answers in repo docs when appropriate.

## Browser interaction

Use `/browse-astack` or the browse binary directly for browser automation. Do not use
other browser MCP integrations in this repo.

## Local contributor state

astack contributor-only local state can live under:

- `~/.astack-dev/evals/`
- `~/.astack-dev/plans/`

These are local only and not checked into the repo.
