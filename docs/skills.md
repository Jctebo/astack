# Skill Deep Dives

This document describes the intended astack workflow and the role of each skill.

## Core Workflow

| Skill | Purpose | Output |
|-------|---------|--------|
| `/scope` | Frame the problem, audience, wedge, and non-goals | `00-scope.md` |
| `/research` | Map the current system, reuse paths, constraints, and unknowns | `01-research.md` |
| `/plan` | Produce the implementation spec and QA matrix | `02-plan.md` |
| `/implement` | Execute the plan and keep progress current | `03-progress.md` |

### `/scope`

`/scope` is the first planning stage. It combines the old brainstorming and
founder-review motions into one plan-mode workflow.

Use it when:

- the problem is still fuzzy
- the user is jumping to implementation too early
- we need to define the narrowest valuable wedge
- success criteria or non-goals are still unclear

It should:

- read the repo before asking broad questions
- challenge assumptions one at a time
- prefer concrete user pain over feature phrasing
- write `00-scope.md` in the repo root

`00-scope.md` should cover:

- problem
- audience
- current status quo
- goal and success criteria
- constraints
- narrow wedge
- non-goals
- risks and unknowns

### `/research`

`/research` is the discovery pass between scope and plan.

Use it when:

- scope is approved but implementation details are still unknown
- we need to understand the existing system before planning
- external docs, APIs, or library constraints matter

It should:

- read `00-scope.md` first
- inspect the relevant code paths and tests
- identify existing patterns worth reusing
- consult primary external references when needed
- write `01-research.md`

`01-research.md` should cover:

- scope baseline
- current system map
- reuse opportunities
- external references
- constraints
- risks
- unknowns
- recommended direction

### `/plan`

`/plan` is the decision-complete implementation planning stage. It replaces the
old engineering review and plan-mode design review split.

Use it when:

- the scope is stable
- the codebase has been researched
- we need a buildable spec before writing code

It should:

- read `00-scope.md` and `01-research.md`
- make architecture and UX decisions explicit
- specify loading, empty, success, and error states when UI exists
- include a concrete QA and test matrix
- write `02-plan.md`

`02-plan.md` should cover:

- summary
- what already exists
- architecture
- UX and states
- implementation outline
- failure modes
- QA and test matrix
- rollout notes
- items out of scope
- open questions

### `/implement`

`/implement` is the build stage.

Use it when:

- `02-plan.md` is approved
- it is time to make code changes
- we want execution tracked against the plan instead of drifting in chat

It should:

- read `02-plan.md` as the source of truth
- implement in focused steps
- validate as it goes
- update `03-progress.md` throughout execution

`03-progress.md` should cover:

- overall status
- checklist
- completed work
- deviations
- blockers
- verification
- follow-ups

## Downstream Skills

### `/review`

Pre-landing code review. It should review the actual diff against the plan and
execution artifacts:

- `02-plan.md`
- `03-progress.md`

Use it before merge or before `/ship`.

### `/qa`

Full QA loop: test, fix, verify. It should read the QA matrix in `02-plan.md`
and the current state in `03-progress.md`.

Use it when:

- implementation is ready for browser testing
- you want bugs fixed, not just reported

### `/qa-only`

Same QA methodology as `/qa`, but report only.

Use it when:

- you want a QA report without code changes

### `/ship`

Release workflow. It should verify the code, docs, and progress state are all
aligned before opening or updating a PR.

Use it when:

- implementation, review, and QA are complete
- the branch is ready to push and propose for merge

### `/document-release`

Post-implementation docs sync. It should update repo docs so they match the
shipped behavior and astack workflow artifacts.

### `/retro`

Retrospective workflow. It can use `00-scope.md` through `03-progress.md` as
sprint context alongside git history.

## Supporting Skills

### `/browse`

Fast persistent browser for dogfooding, QA, screenshots, and authenticated app
testing.

### `/setup-browser-cookies`

Imports cookies from a real browser into the headless browse session.

### `/design-consultation`

Creates a design system from scratch and writes `DESIGN.md`. This is still the
right skill when a product has no visual direction yet.

### `/design-review`

Live-site design QA and polish after implementation.

### `/investigate`

Systematic debugging workflow. Root cause first, fixes second.

### `/codex`

Independent second opinion via Codex CLI.

### `/careful`

Warn before destructive commands.

### `/freeze`

Restrict file edits to one directory.

### `/guard`

Combine `/careful` and `/freeze`.

### `/unfreeze`

Remove the active freeze boundary.

### `/astack-upgrade`

Upgrade astack from the astack fork source, not upstream gstack.

## Intended Workflow

The happy-path loop is:

1. Run `/scope` to define the problem and wedge.
2. Run `/research` to map the current system and constraints.
3. Run `/plan` to lock the implementation and QA spec.
4. Run `/implement` to build and track progress.
5. Run `/review` to compare the diff to the plan.
6. Run `/qa` or `/qa-only` to verify the feature in a browser.
7. Run `/ship` to prepare the branch for merge.
8. Run `/document-release` to sync docs after shipping.
9. Run `/retro` to capture learnings from the sprint.
