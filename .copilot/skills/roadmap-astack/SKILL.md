---
name: roadmap-astack
description: |
  Multi-release roadmap planning. Combines the useful parts of scope discovery,
  repository research, and lightweight planning into one roadmap document with
  a summary first and then release sections. Ask whether the user wants a simple roadmap
  (feature list only) or a detailed roadmap (features and stories). Use when
  asked to "make a roadmap", "plan multiple releases", "sequence this into
  phases", or "turn this into releases and stories".
---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: bun run gen:skill-docs -->

## Preamble (run first)

```bash
_UPD=$(~/.copilot/skills/astack/bin/astack-update-check 2>/dev/null || .copilot/skills/astack/bin/astack-update-check 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
mkdir -p ~/.astack/sessions
touch ~/.astack/sessions/"$PPID"
_SESSIONS=$(find ~/.astack/sessions -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')
find ~/.astack/sessions -mmin +120 -type f -delete 2>/dev/null || true
_CONTRIB=$(~/.copilot/skills/astack/bin/astack-config get astack_contributor 2>/dev/null || true)
_PROACTIVE=$(~/.copilot/skills/astack/bin/astack-config get proactive 2>/dev/null || echo "true")
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "BRANCH: $_BRANCH"
echo "PROACTIVE: $_PROACTIVE"
_LAKE_SEEN=$([ -f ~/.astack/.completeness-intro-seen ] && echo "yes" || echo "no")
echo "LAKE_INTRO: $_LAKE_SEEN"
```

If `PROACTIVE` is `"false"`, do not proactively suggest astack skills â€” only invoke
them when the user explicitly asks. The user opted out of proactive suggestions.

If `LAKE_INTRO` is `no`: Before continuing, introduce the Completeness Principle.
Tell the user: "astack follows the **Boil the Lake** principle — always do the complete
thing when AI makes the marginal cost near-zero. Read more: https://garryslist.org/posts/boil-the-ocean"
Then offer to open the essay in their default browser:

```bash
open https://garryslist.org/posts/boil-the-ocean
touch ~/.astack/.completeness-intro-seen
```

Only run `open` if the user says yes. Always run `touch` to mark as seen. This only happens once.

## AskUserQuestion Format

**ALWAYS follow this structure for every AskUserQuestion call:**
1. **Re-ground:** State the project, the current branch (use the `_BRANCH` value printed by the preamble — NOT any branch from conversation history or gitStatus), and the current plan/task. (1-2 sentences)
2. **Simplify:** Explain the problem in plain English a smart 16-year-old could follow. No raw function names, no internal jargon, no implementation details. Use concrete examples and analogies. Say what it DOES, not what it's called.
3. **Recommend:** `RECOMMENDATION: Choose [X] because [one-line reason]` — always prefer the complete option over shortcuts (see Completeness Principle). Include `Completeness: X/10` for each option. Calibration: 10 = complete implementation (all edge cases, full coverage), 7 = covers happy path but skips some edges, 3 = shortcut that defers significant work. If both options are 8+, pick the higher; if one is ≤5, flag it.
4. **Options:** Lettered options: `A) ... B) ... C) ...` — when an option involves effort, show both scales: `(human: ~X / CC: ~Y)`

Assume the user hasn't looked at this window in 20 minutes and doesn't have the code open. If you'd need to read the source to understand your own explanation, it's too complex.

Per-skill instructions may add additional formatting rules on top of this baseline.

## Completeness Principle — Boil the Lake

AI-assisted coding makes the marginal cost of completeness near-zero. When you present options:

- If Option A is the complete implementation (full parity, all edge cases, 100% coverage) and Option B is a shortcut that saves modest effort — **always recommend A**. The delta between 80 lines and 150 lines is meaningless with CC+astack. "Good enough" is the wrong instinct when "complete" costs minutes more.
- **Lake vs. ocean:** A "lake" is boilable — 100% test coverage for a module, full feature implementation, handling all edge cases, complete error paths. An "ocean" is not — rewriting an entire system from scratch, adding features to dependencies you don't control, multi-quarter platform migrations. Recommend boiling lakes. Flag oceans as out of scope.
- **When estimating effort**, always show both scales: human team time and CC+astack time. The compression ratio varies by task type — use this reference:

| Task type | Human team | CC+astack | Compression |
|-----------|-----------|-----------|-------------|
| Boilerplate / scaffolding | 2 days | 15 min | ~100x |
| Test writing | 1 day | 15 min | ~50x |
| Feature implementation | 1 week | 30 min | ~30x |
| Bug fix + regression test | 4 hours | 15 min | ~20x |
| Architecture / design | 2 days | 4 hours | ~5x |
| Research / exploration | 1 day | 3 hours | ~3x |

- This principle applies to test coverage, error handling, documentation, edge cases, and feature completeness. Don't skip the last 10% to "save time" — with AI, that 10% costs seconds.

**Anti-patterns — DON'T do this:**
- BAD: "Choose B — it covers 90% of the value with less code." (If A is only 70 lines more, choose A.)
- BAD: "We can skip edge case handling to save time." (Edge case handling costs minutes with CC.)
- BAD: "Let's defer test coverage to a follow-up PR." (Tests are the cheapest lake to boil.)
- BAD: Quoting only human-team effort: "This would take 2 weeks." (Say: "2 weeks human / ~1 hour CC.")

## Contributor Mode

If `_CONTRIB` is `true`: you are in **contributor mode**. You're a astack user who also helps make it better.

**At the end of each major workflow step** (not after every single command), reflect on the astack tooling you used. Rate your experience 0 to 10. If it wasn't a 10, think about why. If there is an obvious, actionable bug OR an insightful, interesting thing that could have been done better by astack code or skill markdown — file a field report. Maybe our contributor will help make us better!

**Calibration — this is the bar:** For example, `$B js "await fetch(...)"` used to fail with `SyntaxError: await is only valid in async functions` because astack didn't wrap expressions in async context. Small, but the input was reasonable and astack should have handled it — that's the kind of thing worth filing. Things less consequential than this, ignore.

**NOT worth filing:** user's app bugs, network errors to user's URL, auth failures on user's site, user's own JS logic bugs.

**To file:** write `~/.astack/contributor-logs/{slug}.md` with **all sections below** (do not truncate — include every section through the Date/Version footer):

```
# {Title}

Hey astack team — ran into this while using /{skill-name}:

**What I was trying to do:** {what the user/agent was attempting}
**What happened instead:** {what actually happened}
**My rating:** {0-10} — {one sentence on why it wasn't a 10}

## Steps to reproduce
1. {step}

## Raw output
```
{paste the actual error or unexpected output here}
```

## What would make this a 10
{one sentence: what astack should have done differently}

**Date:** {YYYY-MM-DD} | **Version:** {astack version} | **Skill:** /{skill}
```

Slug: lowercase, hyphens, max 60 chars (e.g. `browse-js-no-await`). Skip if file already exists. Max 3 reports per session. File inline and continue — don't stop the workflow. Tell user: "Filed astack field report: {title}"

## Completion Status Protocol

When completing a skill workflow, report status using one of:
- **DONE** — All steps completed successfully. Evidence provided for each claim.
- **DONE_WITH_CONCERNS** — Completed, but with issues the user should know about. List each concern.
- **BLOCKED** — Cannot proceed. State what is blocking and what was tried.
- **NEEDS_CONTEXT** — Missing information required to continue. State exactly what you need.

### Escalation

It is always OK to stop and say "this is too hard for me" or "I'm not confident in this result."

Bad work is worse than no work. You will not be penalized for escalating.
- If you have attempted a task 3 times without success, STOP and escalate.
- If you are uncertain about a security-sensitive change, STOP and escalate.
- If the scope of work exceeds what you can verify, STOP and escalate.

Escalation format:
```
STATUS: BLOCKED | NEEDS_CONTEXT
REASON: [1-2 sentences]
ATTEMPTED: [what you tried]
RECOMMENDATION: [what the user should do next]
```


# /roadmap-astack

You are running the `/roadmap-astack` workflow. This is a roadmap-first planning
skill. Your job is to produce one durable roadmap document that starts with a
summary of changes and then breaks the work into multiple release sections.

## Hard Gates

- Do NOT write implementation code.
- Do NOT mutate `docs/releases/VERSION` just to plan future work.
- Do NOT create fake future shipped release artifacts under `docs/releases/`.
- Keep the roadmap concrete enough to sequence work, but lighter than an
  implementation-ready `/plan-astack` spec.
- Your durable output lives at `docs/roadmaps/<roadmap-slug>.md`.

## Step 1: Ground in the repo

Read the project context before writing the roadmap:

```bash
git branch --show-current 2>/dev/null || echo "unknown"
git log --oneline -20 2>/dev/null
git diff origin/main --stat 2>/dev/null || true
```

Then read, if present:

- `README.md`
- `CLAUDE.md`
- `TODOS.md`
- `DESIGN.md`
- `docs/releases/RELEASE_LOG.md`
- relevant files in `docs/releases/` that explain the current direction

Use Grep/Glob to inspect the codebase areas most relevant to the request. Treat
existing roadmap docs as drafts to improve, not replace blindly.

## Step 1.5: Resolve the roadmap document

Use this roadmap output contract:

- `docs/roadmaps/<roadmap-slug>.md`

Resolve the roadmap target like this:

- If the user already named the roadmap or file, use that slug.
- If one roadmap file already clearly matches the request, state which exact
  file you are updating and proceed.
- If no roadmap slug is obvious, ask for the roadmap name or slug.
- If multiple existing roadmap files could match, ask which one should be
  updated.

Keep roadmap docs separate from shipped release artifacts so planned future
releases do not overwrite the current release contract.

## Step 1.6: Bootstrap the roadmap branch

If the current branch is `main`, move the roadmap work onto a fresh branch
before you start writing:

1. Derive the branch name from the roadmap slug: `enhancement/<slug>`.
2. If the worktree is dirty, stop and tell the user to commit or stash local
   changes first.
3. If that branch already exists locally, switch to it.
4. Otherwise create it from `main` and continue there.

If the current branch is already a feature branch, keep using it.

## Step 1.7: Lock the roadmap depth

If the user already chose the depth, use it.

Otherwise ask one focused question:

- `Simple roadmap` = features only
- `Detailed roadmap` = features plus user stories for each release

Recommend the detailed mode when the roadmap will be used to delegate work,
sequence implementation, or align multiple collaborators. Recommend the simple
mode when the user only wants prioritization and release ordering.

Record the chosen mode in the roadmap doc.

## Step 2: Combine scope, research, and planning

Do the useful parts of `/scope-astack`, `/research-astack`, and `/plan-astack`
without turning this into a code-ready build spec:

- Clarify the problem, audience, and desired outcome.
- Inspect the existing system and note what already exists.
- Identify dependencies, constraints, and reuse opportunities.
- Break the work into sensible releases with a clear reason for the order.
- Keep facts separate from inference.
- Ask focused questions only when the answer changes release ordering, roadmap
  depth, or the number of releases.

Prefer 2-5 releases unless the user explicitly asks for a broader or narrower
roadmap.

## Step 3: Write the roadmap document

Write or update `docs/roadmaps/<roadmap-slug>.md` with this structure:

```markdown
# Roadmap: <title>

## Summary Of Changes
- High-level summary of what is changing
- Why the roadmap exists now

## Roadmap Mode
- Simple roadmap | Detailed roadmap

## Problem
- Core user or business problem

## Audience
- Primary user
- Secondary stakeholders

## Current Status Quo
- What people do today
- Why that is insufficient

## What Already Exists
- Existing code, systems, docs, or patterns we can reuse

## Sequencing Principles
- Why the releases are ordered this way
- Constraints or dependencies shaping the order

## Release Overview
- Release 1: name + short outcome
- Release 2: name + short outcome
- Additional releases only when needed

## Release 1: <title>

### Goal
- Desired outcome for this release

### Scope
- What is in this release
- What is explicitly deferred

### Why This Release Now
- Dependencies, learning value, or urgency

### Research Notes
- Relevant files, systems, or external constraints

### Plan
- Lightweight delivery approach
- Validation expectations

### Features
- Feature 1
- Feature 2

### Stories
- Only include this section in detailed mode
- As a <user>, I want <capability>, so that <outcome>

### Dependencies
- Technical or product dependencies

### Risks
- Main risks for this release

### Exit Criteria
- What must be true to call this release complete

## Release N: <title>
- Repeat the same structure for each release

## Cross-Cutting Risks
- Risks that affect multiple releases

## Assumptions And Unknowns
- Facts that still need validation

## Recommended Next Step
- Which release should be planned in detail first
```

Requirements:

- Keep this file executive-readable at the top and delivery-usable in the
  release sections.
- Start with the summary of changes before drilling into releases.
- Preserve useful existing material when updating a roadmap.

- The roadmap doc should let a human scan the whole plan quickly from the top.
- The release sections should stand on their own even though they live in the
  same document.
- In simple mode, omit `Stories` entirely.
- In detailed mode, keep stories concise and outcome-oriented.
- Do not over-spec implementation details that belong in `/plan-astack`.

## Step 4: Handoff

After writing the roadmap document:

- Summarize the roadmap in release order.
- Call out the biggest cross-release risk.
- Recommend `/plan-astack` for the first release that should move into
  implementation planning next.
