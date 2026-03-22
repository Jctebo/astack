---
name: plan-astack
description: |
  Unified planning review. Combines engineering review, design review, and
  implementation planning into one plan-mode skill that resolves decisions and
  updates the `Plan` section in the active release artifact. Use when asked to
  "make the plan", "review the architecture", "lock the implementation plan",
  or "finalize what we should build".
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


# /plan-astack

You are running the `/plan-astack` workflow. This is the final plan-mode stage before
implementation. Your job is to turn the `Scope` and `Research` sections in the
active release artifact into one decision-complete `Plan` section.

## Hard Gates

- Do NOT write implementation code.
- Do NOT leave important technical or UX choices implicit.
- Do NOT include verbose exploration logs or rejected alternatives unless they
  are critical context for the chosen plan.
- Your only durable output is the selected release artifact in `docs/releases/`.

## Step 1: Gather the planning inputs

Read these files first if they exist:

- `docs/releases/RELEASE_LOG.md`
- the selected release artifact
- `DESIGN.md`
- `README.md`
- `CLAUDE.md`
- `TODOS.md`

Then inspect the code paths, types, routes, components, and tests most relevant
to the request.

If the selected release artifact is missing a `Scope` or `Research` section,
say so explicitly and proceed only if the user has already provided enough
context. Otherwise recommend running the missing stage first.

## Step 2: Resolve the remaining decisions

Treat this like a combined engineering + design review:

- Reuse existing code and patterns whenever possible.
- Prefer the smallest design that fully solves the scoped problem.
- Break the build into phases that can be implemented and verified
  independently.
- Make interfaces, state transitions, and error handling explicit.
- Specify the user-facing behavior, not just backend mechanics.
- If there is UI scope, define empty, loading, success, and error states.
- If there is no UI scope, say that plainly and keep the design section light.
- Name exact files, functions, classes, routes, components, and tests whenever
  they are known.

Use AskUserQuestion only for real tradeoffs that materially change the build:

- architecture or integration choice
- UX pattern or interaction model
- rollout or compatibility decision
- test/eval scope when more than one sensible option exists

## Step 3: Write the `Plan` section

Write or update the `Plan` section in the selected release artifact with this
structure:

```markdown
## Plan

### Summary
- What we are building
- Why this plan is the chosen approach

### What Already Exists
- Existing code, patterns, or systems we will reuse

### Architecture
- Components, services, data flow, interfaces

### Concrete Changes
- Exact file paths to edit
- Specific functions, classes, components, routes, or interfaces to modify
- New files, migrations, or tests to add

### UX And States
- User journey
- Loading / empty / success / error states
- Accessibility or responsive notes if relevant

### Implementation Phases
#### Phase 1: <name>
- Goal
- Exact files to edit
- Symbols/interfaces touched
- Change summary
- Verification steps or commands
- Rollback note
- Dependencies on earlier phases, if any

#### Phase N: <name>
- Goal
- Exact files to edit
- Symbols/interfaces touched
- Change summary
- Verification steps or commands
- Rollback note
- Dependencies on earlier phases, if any

### Failure Modes
- What can break
- How we detect it
- How the user experiences it

### QA And Test Matrix
- Routes/pages to verify
- Critical flows
- Edge cases
- Regression tests or evals required

### Rollout Notes
- Flags, migrations, rollout sequencing, or compatibility notes

### Not In Scope
- Explicitly deferred work

### Open Questions
- Remaining unknowns, if any
```

Additional requirements:

- Include at least one ASCII diagram for non-trivial flows.
- Keep the plan compact and execution-oriented. Do not restate the full
  research log.
- The `QA And Test Matrix` must be specific enough for `/qa-astack` and `/qa-only-astack` to
  use directly.
- The `Concrete Changes` section must use exact file paths whenever possible.
- Every phase must be independently verifiable and concrete enough for
  `/implement-astack` to execute without guessing.
- Preserve the rest of the selected release artifact unchanged.

## Step 4: Handoff

After writing the `Plan` section:

- Summarize the plan in implementation order.
- Call out the highest-risk part of the build.
- If material open questions remain, say the plan is not approved for
  implementation yet and call out what needs to be resolved first.
- Recommend `/implement-astack` only when the plan is decision-complete enough to
  execute safely.
