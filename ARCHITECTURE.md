# Architecture

This document explains the main design decisions behind astack.

## Core idea

astack combines:

- a persistent fast browser runtime for QA and dogfooding
- generated skill docs
- a workflow-first skill system built around repo-root artifacts

The browser is the runtime piece. The workflow logic is mostly Markdown.

## Workflow architecture

The planning and delivery loop is artifact-driven:

```text
/scope-astack      -> 00-scope.md
/research-astack   -> 01-research.md
/plan-astack       -> 02-plan.md
/implement-astack  -> 03-progress.md
```

Downstream skills consume those artifacts:

- `/review-astack` compares the diff to `02-plan.md` and `03-progress.md`
- `/qa-astack` reads the QA matrix in `02-plan.md`
- `/ship-astack` checks code, docs, and plan alignment
- `/document-release-astack` syncs docs to shipped behavior
- `/retro-astack` uses the numbered docs as sprint context

This keeps planning context visible in the repo instead of burying it in hidden
branch-local state.

This artifact-first flow was informed in part by HumanLayer's DeepWiki material
on research and planning for coding agents, particularly the emphasis on
separating repository research from planning and then compacting that context
into durable artifacts for implementation.

## Browser daemon

astack keeps a long-lived Chromium session behind the `browse` CLI so agents can
work with:

- persistent tabs
- cookies and local storage
- sub-second follow-up commands

The first call starts the daemon. Later commands talk to it over localhost.

## Why Bun

Bun is used here for:

- compiled binaries
- native TypeScript execution during development
- a lightweight server runtime
- SQLite access used by the cookie import path

On Windows, browse can fall back to Node.js where Bun runtime behavior is still
rough around Playwright transport.

## State and config

Runtime state is stored under `.astack/` inside a project when the browse stack
is running locally. User-global astack state lives under `~/.astack/` and
developer-only local state under `~/.astack-dev/`.

## Template generation

Skill docs are generated from `.tmpl` templates. The generator is the single
place where shared injected sections are assembled for Claude and Codex hosts.

Key injected sections include:

| Placeholder | Purpose |
|-------------|---------|
| `{{PREAMBLE}}` | Shared startup behavior and update checks |
| `{{BROWSE_SETUP}}` | Browse discovery and setup instructions |
| `{{BASE_BRANCH_DETECT}}` | Dynamic PR base branch detection |
| `{{QA_METHODOLOGY}}` | Shared QA methodology for `/qa-astack` and `/qa-only-astack` |
| `{{DESIGN_METHODOLOGY}}` | Shared design QA methodology |
| `{{REVIEW_DASHBOARD}}` | Plan-and-review readiness dashboard |
| `{{TEST_BOOTSTRAP}}` | Test framework bootstrap instructions |

## Host generation

The repo generates:

- Claude-style skills rooted at `astack`
- Codex and Copilot sidecar skills named from canonical skill `name:` values like `plan-astack`

That keeps install paths stable while letting host-discoverable skill names match the canonical command names.

See `docs/host-support.md` for the normalized host contract, install roots, and
Copilot support boundary.

## Fork position

astack is a fork of gstack, but this repo is the source of truth for:

- astack naming
- astack workflow docs
- astack upgrade paths
- the `/scope-astack` -> `/research-astack` -> `/plan-astack` -> `/implement-astack` lifecycle
