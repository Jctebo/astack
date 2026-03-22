# astack

astack is a fork of `gstack` that turns agent skills into a clear software
delivery workflow:

**scope -> research -> plan -> implement -> review -> qa -> ship -> retro**

The planning path is now built around four canonical commands:

- `/scope-astack` writes `00-scope.md`
- `/research-astack` writes `01-research.md`
- `/plan-astack` writes `02-plan.md`
- `/implement-astack` updates `03-progress.md`

Those four repo-root artifacts are the source of truth for the whole sprint.
Operational skills like `/review-astack`, `/qa-astack`, `/ship-astack`, and `/document-release-astack`
consume them instead of relying on hidden per-branch planning files.

## What astack is for

- Turn vague feature requests into a scoped build plan
- Map the existing codebase before implementation starts
- Keep implementation aligned with the approved plan
- Review, test, ship, and document changes with the same workflow context

astack still includes the supporting skill set from gstack:

- `/browse-astack`
- `/review-astack`
- `/qa-astack`
- `/qa-only-astack`
- `/ship-astack`
- `/document-release-astack`
- `/retro-astack`
- `/design-consultation-astack`
- `/design-review-astack`
- `/investigate-astack`
- `/codex-astack`
- `/setup-browser-cookies-astack`
- `/careful-astack`
- `/freeze-astack`
- `/guard-astack`
- `/unfreeze-astack`
- `/astack-upgrade-astack`

For the durable host contract and naming rules, see [docs/host-support.md](docs/host-support.md).
For per-skill workflow details, see [docs/skills.md](docs/skills.md).

## Workflow

### 1. `/scope-astack`

Use `/scope-astack` when the request is still fuzzy or needs a stronger wedge. It
combines the old brainstorming and founder-review stages into one plan-mode
step and writes `00-scope.md`.

`00-scope.md` captures:

- problem framing
- audience
- current workaround / status quo
- success criteria
- constraints
- narrow wedge
- non-goals
- open risks and unknowns

### 2. `/research-astack`

Use `/research-astack` after scope is settled. It reads `00-scope.md`, maps the
current system, identifies reuse opportunities, checks relevant docs, and
writes `01-research.md`.

`01-research.md` captures:

- current system map
- reusable code and patterns
- external docs and dependencies
- constraints
- risks
- unknowns
- recommended implementation direction

### 3. `/plan-astack`

Use `/plan-astack` when we are ready to lock the implementation spec. It combines the
old engineering review, plan-mode design review, and implementation planning
into one plan-mode pass that writes `02-plan.md`.

`02-plan.md` captures:

- summary
- what already exists
- architecture
- UX and state coverage
- implementation outline
- failure modes
- QA and test matrix
- rollout notes
- items explicitly out of scope

### 4. `/implement-astack`

Use `/implement-astack` once the plan is approved. It reads `02-plan.md`, makes the
code changes, and maintains `03-progress.md` throughout execution.

`03-progress.md` tracks:

- status
- checklist completion
- completed work
- deviations from plan
- blockers
- verification steps
- follow-up items

### 5. Review, QA, Ship, Reflect

After implementation:

- `/review-astack` checks the diff against `02-plan.md` and `03-progress.md`
- `/qa-astack` and `/qa-only-astack` use the QA matrix in `02-plan.md`
- `/ship-astack` verifies code, docs, and progress are aligned before opening a PR
- `/document-release-astack` syncs project docs to what actually shipped
- `/retro-astack` uses the numbered docs as sprint context

## Install

Until your final GitHub owner is decided, replace `<owner>` below with the
account that will host the public fork.

Windows note: `setup` requires both Bun and Node.js. Bun is the main runtime,
and Node.js is required on Windows for the Playwright/Chromium verification
path.

### Claude Code

```bash
git clone https://github.com/Jctebo/astack.git ~/.claude/skills/astack
cd ~/.claude/skills/astack
./setup
```

### Codex

```bash
git clone https://github.com/Jctebo/astack.git ~/.codex/skills/astack
cd ~/.codex/skills/astack
./setup --host codex
```

### GitHub Copilot

```bash
git clone https://github.com/Jctebo/astack.git ~/src/astack
cd ~/src/astack
./setup --host copilot
```

Copilot v1 currently installs the base planning workflow only:
`/scope-astack`, `/research-astack`, `/plan-astack`, and `/implement-astack`.
The exact host support boundary is documented in [docs/host-support.md](docs/host-support.md).

### Vendoring into a repo

```bash
cp -Rf ~/.claude/skills/astack .claude/skills/astack
rm -rf .claude/skills/astack/.git
cd .claude/skills/astack
./setup
```

## Minimal project note for agents

Add an `astack` section to your project instructions:

```md
## astack
Use `/browse-astack` from astack for web browsing.
Prefer the astack workflow:
`/scope-astack` -> `/research-astack` -> `/plan-astack` -> `/implement-astack` -> `/review-astack` -> `/qa-astack` -> `/ship-astack`.
Available skills: `/scope-astack`, `/research-astack`, `/plan-astack`, `/implement-astack`, `/review-astack`,
`/qa-astack`, `/qa-only-astack`, `/browse-astack`, `/ship-astack`, `/document-release-astack`, `/retro-astack`,
`/design-consultation-astack`, `/design-review-astack`, `/investigate-astack`, `/codex-astack`,
`/setup-browser-cookies-astack`, `/careful-astack`, `/freeze-astack`, `/guard-astack`, `/unfreeze-astack`,
`/astack-upgrade-astack`.
```

## Repo layout

```text
astack/
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
├── browse/                 # headless browser runtime + tests
├── docs/                   # durable contributor and host documentation
├── scripts/                # generators and validation tooling
├── test/                   # skill validation + eval suites
├── .agents/skills/         # generated sidecar skills for Codex-style hosts
├── .copilot/skills/        # generated sidecar skills for Copilot
├── SKILL.md.tmpl           # root skill template
└── setup                   # install + registration entrypoint
```

## Development

```bash
bun install
bun run gen:skill-docs
bun run gen:skill-docs --host codex
bun run gen:skill-docs --host copilot
bun run build
bun test
bun run skill:check
```

## Attribution

astack is forked from `gstack`. Upstream provenance and license notices are
preserved, but this repo is the source of truth for astack naming, workflow,
and upgrades.

## License

MIT
