# astack

astack is a fork of `gstack` that turns agent skills into a clear software
delivery workflow:

**scope -> architecture -> research -> plan -> implement -> review -> qa -> ship -> retro**

When the deliverable is a phased roadmap instead of one implementation-ready
spec, `/roadmap-astack` creates one roadmap doc under `docs/roadmaps/` with a
summary of changes first and release sections after it.

The planning path is now built around one canonical release artifact model:

- `/scope-astack` updates the `Scope` section and bootstraps the enhancement branch when starting on `main`
- `/architecture-astack` writes the full architecture doc to `docs/architecture/` and adds a pointer summary to the active release artifact
- `/research-astack` updates the `Research` section
- `/plan-astack` updates the `Plan` section
- `/roadmap-astack` creates one roadmap doc with a summary first and per-release sections after it
- `/implement-astack` updates the `Progress` section

Those workflow sections live in `docs/releases/<version>-<slug>.md`, alongside
`docs/releases/VERSION` and `docs/releases/RELEASE_LOG.md`. Operational skills
like `/review-astack`, `/qa-astack`, `/ship-astack`, and
`/document-release-astack` consume the active release artifact instead of
relying on hidden per-branch planning files.

The newest enhancement, `end-to-end`, is the workflow that carries one request
from scope through ship, docs sync, merge prompt, and local cleanup when the
path stays clear.

That same `docs/releases/` folder is also the canonical machine-facing release
contract. astack no longer treats repo-root `VERSION` or `CHANGELOG.md` as the
source of truth.

The shape of that core workflow was informed in part by HumanLayer's
"Advanced Context Engineering for Coding Agents" DeepWiki, especially the
research and planning phase writeups:
https://deepwiki.com/humanlayer/advanced-context-engineering-for-coding-agents/3.1-research-phase
and
https://deepwiki.com/humanlayer/advanced-context-engineering-for-coding-agents/3.2-planning-phase

In astack, that influence shows up mainly in the explicit research-before-plan
split, the review gate between those phases, and the use of durable release
artifacts to compact context for implementation.

## What astack is for

- Turn vague feature requests into a scoped build plan
- Break larger initiatives into multiple releases with optional stories
- Decide system architecture early and document it durably
- Map the existing codebase before implementation starts
- Keep implementation aligned with the approved plan
- Review, test, ship, and document changes with the same workflow context

astack still includes the supporting skill set from gstack:

- `/browse-astack`
- `/architecture-astack`
- `/end-to-end`
- `/document-release-astack`
- `/roadmap-astack`
- `/qa-only-astack`
- `/review-astack`
- `/qa-astack`
- `/ship-astack`
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
step and updates the `Scope` section in the active release artifact at
`docs/releases/<version>-<slug>.md`.
If you start from `main`, astack will create or reuse `enhancement/<slug>`
before it writes the scope so the enhancement work stays on its own branch.
That same branch is reused as the request moves through research, plan,
implementation, QA, and ship.

The `Scope` section captures:

- problem framing
- audience
- current workaround / status quo
- success criteria
- constraints
- narrow wedge
- non-goals
- open risks and unknowns

### 2. `/architecture-astack`

Use `/architecture-astack` when a project or major subsystem needs an explicit architecture pass before detailed planning. It writes the full architecture doc to `docs/architecture/` and adds a short pointer summary to the active release artifact.

The architecture doc captures:

- problem and scope
- current or expected system shape
- major components and responsibilities
- data flow and integration points
- deployment and operational assumptions
- key tradeoffs
- open questions and risks
- next-step handoff

### 3. `/research-astack`

Use `/research-astack` after scope is settled. It reads the active release
artifact's `Scope` section, maps the current system, identifies reuse
opportunities, checks relevant docs, and updates the `Research` section.

The `Research` section captures:

- current system map
- reusable code and patterns
- external docs and dependencies
- constraints
- risks
- unknowns
- recommended implementation direction

### 4. `/plan-astack`

Use `/plan-astack` when we are ready to lock the implementation spec. It combines the
old engineering review, plan-mode design review, and implementation planning
into one plan-mode pass that updates the `Plan` section in the active release
artifact.

The `Plan` section captures:

- summary
- what already exists
- architecture
- UX and state coverage
- implementation outline
- failure modes
- QA and test matrix
- rollout notes
- items explicitly out of scope

### `/roadmap-astack`

Use `/roadmap-astack` when the real deliverable is a phased roadmap rather than
one implementation-ready feature plan. It combines scoped framing, repository
research, and lightweight planning into one roadmap doc under
`docs/roadmaps/<slug>.md`.

That roadmap doc starts with a summary of changes, then breaks the work into
release sections inside the same file.

The roadmap output captures:

- summary of changes
- release ordering and why
- reusable systems and constraints
- features per release section
- optional stories per release section
- cross-release risks and assumptions

### 5. `/implement-astack`

Use `/implement-astack` once the plan is approved. It reads the active release
artifact's `Plan` section, makes the code changes, and maintains the
`Progress` section throughout execution.

The `Progress` section tracks:

- status
- checklist completion
- completed work
- deviations from plan
- blockers
- verification steps
- follow-up items

### 5. Review, QA, Ship, Reflect

After implementation:

- `/review-astack` checks the diff against the active release artifact's `Plan`
  and `Progress` sections
- `/qa-astack` and `/qa-only-astack` use the QA matrix in the active release
  artifact's `Plan` section
- `/ship-astack` verifies code, docs, and progress are aligned, updates
  `docs/releases/VERSION`, appends `docs/releases/RELEASE_LOG.md`, and turns the
  active release artifact into a shipped record before opening a PR, asks
  whether to merge it, and after approval deletes the branch and switches back
  to `main`
- `/document-release-astack` syncs project docs to what actually shipped and
  rewrites the active release artifact into polished past-tense archival form
- `/retro-astack` uses release artifacts and commit history as sprint context

For unattended enhancement runs, astack should call the existing skills in
sequence and stop whenever a step needs human judgment, branch recovery, or a
non-transient fix.

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
git clone https://github.com/Jctebo/astack.git ~/src/astack
cd ~/src/astack
./setup --host codex
```

Codex note: `setup --host codex` installs the runtime entrypoint under
`~/.codex/skills/astack`, but the git checkout you ran setup from remains the
source of truth for upgrades.

### GitHub Copilot

```bash
git clone https://github.com/Jctebo/astack.git ~/src/astack
cd ~/src/astack
./setup --host copilot
```

Copilot installs the full astack skill surface.
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
For phased multi-release planning, use `/roadmap-astack` as the roadmap-first alternative to the separate scope/research/plan chain.
Available skills: `/scope-astack`, `/architecture-astack`, `/research-astack`, `/plan-astack`, `/roadmap-astack`, `/implement-astack`,
`/review-astack`, `/qa-astack`, `/qa-only-astack`, `/ship-astack`, `/document-release-astack`, `/retro-astack`,
`/browse-astack`, `/setup-browser-cookies-astack`, `/design-consultation-astack`, `/design-review-astack`,
`/investigate-astack`, `/codex-astack`, `/careful-astack`, `/freeze-astack`, `/guard-astack`,
`/unfreeze-astack`, `/astack-upgrade-astack`, `/end-to-end`.
```

## Repo layout

```text
astack/
├── roadmap/                # /roadmap skill
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

The current core workflow was also informed by HumanLayer's DeepWiki material on
research and planning for coding agents:
- https://deepwiki.com/humanlayer/advanced-context-engineering-for-coding-agents/3.1-research-phase
- https://deepwiki.com/humanlayer/advanced-context-engineering-for-coding-agents/3.2-planning-phase

## License

MIT
