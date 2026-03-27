# Skill Deep Dives

This document describes the intended astack workflow and the role of each skill.

For install roots, generated host folders, and Copilot scope, see
`docs/host-support.md`.

## Core Workflow

| Skill | Purpose | Output |
|-------|---------|--------|
| `/scope-astack` | Frame the problem, audience, wedge, and non-goals; auto-bootstrap the enhancement branch when starting on `main` | `Scope` section in `docs/releases/<version>-<slug>.md` |
| `/architecture-astack` | Shape the early technical direction and write durable architecture docs | `docs/architecture/<scope>.md` plus a summary pointer in the active release artifact |
| `/research-astack` | Map the current system, reuse paths, constraints, and unknowns | `Research` section in `docs/releases/<version>-<slug>.md` |
| `/plan-astack` | Produce the implementation spec and QA matrix | `Plan` section in `docs/releases/<version>-<slug>.md` |
| `/roadmap-astack` | Create a multi-release roadmap document with a summary first and then release sections | `docs/roadmaps/<slug>.md` |
| `/implement-astack` | Execute the plan and keep progress current | `Progress` section in `docs/releases/<version>-<slug>.md` |

### `/scope-astack`

`/scope-astack` is the first planning stage. It combines the old brainstorming and
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
- update the `Scope` section in the active release artifact
- create or reuse `enhancement/<slug>` when the workflow starts on `main`

### `/architecture-astack`

`/architecture-astack` is the early technical design pass.

Use it when:

- the user wants to shape system architecture before implementation details
- a project or major subsystem needs a durable architecture record
- we need a technical decision document before scope/architecture/research/plan takes over

It should:

- read the repo context and active release artifact first
- ask only architecture-shaping questions
- compare viable system shapes and tradeoffs
- write the full architecture doc under `docs/architecture/`
- add a short summary and pointer in the active release artifact
- hand off to `/scope-astack`, `/research-astack`, or `/plan-astack` as appropriate

The architecture doc should cover:

- problem and scope
- current or expected system shape
- major components and responsibilities
- data flow and integration points
- deployment and operational assumptions
- key tradeoffs
- open questions and risks
- next-step handoff

The `Scope` section should cover:

- problem
- audience
- current status quo
- goal and success criteria
- constraints
- narrow wedge
- non-goals
- risks and unknowns

### `/research-astack`

`/research-astack` is the discovery pass between scope and plan.

Use it when:

- scope is approved but implementation details are still unknown
- we need to understand the existing system before planning
- external docs, APIs, or library constraints matter

It should:

- read the active release artifact's `Scope` section first
- inspect the relevant code paths and tests
- identify existing patterns worth reusing
- consult primary external references when needed
- update the `Research` section
- keep using the same enhancement branch created by `/scope-astack`

The `Research` section should cover:

- scope baseline
- current system map
- reuse opportunities
- external references
- constraints
- risks
- unknowns
- recommended direction

### `/plan-astack`

`/plan-astack` is the decision-complete implementation planning stage. It replaces the
old engineering review and plan-mode design review split.

Use it when:

- the scope is stable
- the codebase has been researched
- we need a buildable spec before writing code

It should:

- read the active release artifact's `Scope` and `Research` sections
- make architecture and UX decisions explicit
- specify loading, empty, success, and error states when UI exists
- include a concrete QA and test matrix
- update the `Plan` section
- keep using the same enhancement branch when the work started on `main`

The `Plan` section should cover:

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

### `/roadmap-astack`

`/roadmap-astack` is the roadmap-first planning alternative for work that spans
multiple releases.

Use it when:

- the user wants a roadmap instead of one implementation-ready spec
- the work should be sequenced across multiple releases
- we need a summary of changes first and then release sections in the same document
- the user may want features only or features plus stories

It should:

- read the repo and current docs before splitting the work
- ask whether the user wants a simple roadmap or a detailed roadmap
- write one roadmap doc under `docs/roadmaps/<slug>.md`
- structure the file as a summary first, then release sections
- keep roadmap docs separate from `docs/releases/` so future plans do not
  mutate the shipped release contract

The roadmap document should cover:

- summary of changes
- problem and audience
- sequencing principles
- release ordering
- reusable systems and constraints
- per-release features
- optional stories per release
- risks and assumptions

The release sections should stand on their own, but remain lighter than a full
`/plan-astack` implementation spec. When the user is ready to execute a
specific release, `/plan-astack` should turn that release section into the
detailed implementation plan.

### `/implement-astack`

`/implement-astack` is the build stage.

Use it when:

- the active release artifact's `Plan` section is approved
- it is time to make code changes
- we want execution tracked against the plan instead of drifting in chat

It should:

- read the `Plan` section as the source of truth
- implement in focused steps
- validate as it goes
- update the `Progress` section throughout execution
- keep using the same enhancement branch as the planning stages

The `Progress` section should cover:

- overall status
- checklist
- completed work
- deviations
- blockers
- verification
- follow-ups

## Downstream Skills

### `/review-astack`

Pre-landing code review. It should review the actual diff against the plan and
execution artifacts:

- the active release artifact's `Plan` section
- the active release artifact's `Progress` section

Use it before merge or before `/ship-astack`.

### `/qa-astack`

Full QA loop: test, fix, verify. It should read the QA matrix in the active
release artifact's `Plan` section and the current state in its `Progress`
section.

Use it when:

- implementation is ready for browser testing
- you want bugs fixed, not just reported

### `/qa-only-astack`

Same QA methodology as `/qa-astack`, but report only.

Use it when:

- you want a QA report without code changes

### `/ship-astack`

Release workflow. It should verify the code, docs, and progress state are all
aligned before opening or updating a PR, then ask whether to merge the PR and
clean up the branch if the user says yes.

Use it when:

- implementation, review, and QA are complete
- the branch is ready to push and propose for merge

### `/end-to-end`

`end-to-end` is the unattended enhancement wedge. It is not a new hidden skill;
it is the complete use of the existing workflow in sequence.

Use it when:

- one enhancement request should carry itself from scope to ship
- the remaining stops are known human decisions, not missing automation

It should:

- call the existing skills in order
- carry the same release artifact through the whole path
- retry once for clearly transient failures
- stop immediately for branch conflicts, merge ambiguity, or user judgment

The real skill is `/end-to-end`, installed alongside the other astack skills.

The `end-to-end` enhancement should finish with:

- the PR opened
- docs synced
- merge prompted
- branch cleaned up locally after a successful merge

### `/document-release-astack`

Post-implementation docs sync. It should update repo docs so they match the
shipped behavior and astack workflow artifacts.

### `/retro-astack`

Retrospective workflow. It can use the active release artifact as sprint context
alongside git history.

## Supporting Skills

### `/browse-astack`

Fast persistent browser for dogfooding, QA, screenshots, and authenticated app
testing.

### `/setup-browser-cookies-astack`

Imports cookies from a real browser into the headless browse session.

### `/design-consultation-astack`

Creates a design system from scratch and writes `DESIGN.md`. This is still the
right skill when a product has no visual direction yet.

### `/design-review-astack`

Live-site design QA and polish after implementation.

### `/investigate-astack`

Systematic debugging workflow. Root cause first, fixes second.

### `/codex-astack`

Independent second opinion via Codex CLI.

### `/careful-astack`

Warn before destructive commands.

### `/freeze-astack`

Restrict file edits to one directory.

### `/guard-astack`

Combine `/careful-astack` and `/freeze-astack`.

### `/unfreeze-astack`

Remove the active freeze boundary.

### `/astack-upgrade-astack`

Upgrade astack from the astack fork source, not upstream gstack.

## Intended Workflow

The happy-path loop is:

1. Run `/scope-astack` to define the problem and wedge. If the work started on `main`, this creates or reuses the enhancement branch.
2. Run `/research-astack` to map the current system and constraints.
3. Run `/plan-astack` to lock the implementation and QA spec.
   Or run `/roadmap-astack` instead when the deliverable should be a summary of changes plus multiple release sections in one roadmap document.
4. Run `/implement-astack` to build and track progress.
5. Run `/review-astack` to compare the diff to the plan.
6. Run `/qa-astack` or `/qa-only-astack` to verify the feature in a browser.
7. Run `/ship-astack` to prepare the branch for merge, create the PR, and optionally merge it.
8. Run `/document-release-astack` to sync docs after shipping.
9. Run `/retro-astack` to capture learnings from the sprint.
