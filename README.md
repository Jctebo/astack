# astack

astack is a fork of `gstack` that turns agent skills into a clear software
delivery workflow:

**scope -> research -> plan -> implement -> review -> qa -> ship -> retro**

The planning path is now built around four canonical commands:

- `/scope` writes `00-scope.md`
- `/research` writes `01-research.md`
- `/plan` writes `02-plan.md`
- `/implement` updates `03-progress.md`

Those four repo-root artifacts are the source of truth for the whole sprint.
Operational skills like `/review`, `/qa`, `/ship`, and `/document-release`
consume them instead of relying on hidden per-branch planning files.

## What astack is for

- Turn vague feature requests into a scoped build plan
- Map the existing codebase before implementation starts
- Keep implementation aligned with the approved plan
- Review, test, ship, and document changes with the same workflow context

astack still includes the supporting skill set from gstack:

- `/browse`
- `/review`
- `/qa`
- `/qa-only`
- `/ship`
- `/document-release`
- `/retro`
- `/design-consultation`
- `/design-review`
- `/investigate`
- `/codex`
- `/setup-browser-cookies`
- `/careful`
- `/freeze`
- `/guard`
- `/unfreeze`
- `/astack-upgrade`

## Workflow

### 1. `/scope`

Use `/scope` when the request is still fuzzy or needs a stronger wedge. It
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

### 2. `/research`

Use `/research` after scope is settled. It reads `00-scope.md`, maps the
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

### 3. `/plan`

Use `/plan` when we are ready to lock the implementation spec. It combines the
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

### 4. `/implement`

Use `/implement` once the plan is approved. It reads `02-plan.md`, makes the
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

- `/review` checks the diff against `02-plan.md` and `03-progress.md`
- `/qa` and `/qa-only` use the QA matrix in `02-plan.md`
- `/ship` verifies code, docs, and progress are aligned before opening a PR
- `/document-release` syncs project docs to what actually shipped
- `/retro` uses the numbered docs as sprint context

## Install

Until your final GitHub owner is decided, replace `<owner>` below with the
account that will host the public fork.

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
Use `/browse` from astack for web browsing.
Prefer the astack workflow:
`/scope` -> `/research` -> `/plan` -> `/implement` -> `/review` -> `/qa` -> `/ship`.
Available skills: `/scope`, `/research`, `/plan`, `/implement`, `/review`,
`/qa`, `/qa-only`, `/browse`, `/ship`, `/document-release`, `/retro`,
`/design-consultation`, `/design-review`, `/investigate`, `/codex`,
`/setup-browser-cookies`, `/careful`, `/freeze`, `/guard`, `/unfreeze`,
`/astack-upgrade`.
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
├── scripts/                # generators and validation tooling
├── test/                   # skill validation + eval suites
├── .agents/skills/         # generated sidecar skills for Codex-style hosts
├── SKILL.md.tmpl           # root skill template
└── setup                   # install + registration entrypoint
```

## Development

```bash
bun install
bun run gen:skill-docs
bun run gen:skill-docs --host codex
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
