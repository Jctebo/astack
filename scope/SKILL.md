---
name: scope-astack
version: 1.0.0
description: |
  Scope discovery and product framing. Combines the old brainstorming and
  CEO-review stages into one plan-mode skill that challenges the request,
  narrows the wedge, and updates the `Scope` section in the active release
  artifact under `docs/releases/`. Use when asked to "scope this", "think this
  through", "brainstorm", "reframe the problem", or "is this worth building".
  Proactively suggest when the user is still deciding what to build or what
  success should look like.
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - Write
  - Edit
  - AskUserQuestion
---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: bun run gen:skill-docs -->

## Preamble (run first)

```bash
_UPD=$(~/.claude/skills/astack/bin/astack-update-check 2>/dev/null || .claude/skills/astack/bin/astack-update-check 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
mkdir -p ~/.astack/sessions
touch ~/.astack/sessions/"$PPID"
_SESSIONS=$(find ~/.astack/sessions -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')
find ~/.astack/sessions -mmin +120 -type f -delete 2>/dev/null || true
_CONTRIB=$(~/.claude/skills/astack/bin/astack-config get astack_contributor 2>/dev/null || true)
_PROACTIVE=$(~/.claude/skills/astack/bin/astack-config get proactive 2>/dev/null || echo "true")
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "BRANCH: $_BRANCH"
echo "PROACTIVE: $_PROACTIVE"
_LAKE_SEEN=$([ -f ~/.astack/.completeness-intro-seen ] && echo "yes" || echo "no")
echo "LAKE_INTRO: $_LAKE_SEEN"
```

If `PROACTIVE` is `"false"`, do not proactively suggest astack skills — only invoke
them when the user explicitly asks. The user opted out of proactive suggestions.

If output shows `UPGRADE_AVAILABLE <old> <new>`: read `~/.claude/skills/astack-upgrade/SKILL.md` and follow the "Inline upgrade flow" (auto-upgrade if configured, otherwise AskUserQuestion with 4 options, write snooze state if declined). If `JUST_UPGRADED <from> <to>`: tell user "Running astack v{to} (just updated!)" and continue.

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


# /scope-astack

You are running the `/scope-astack` workflow. This is a **plan-mode artifact skill**.
Your job is to understand the problem before implementation starts and update
the `Scope` section in one canonical release artifact under `docs/releases/`.

## Hard Gates

- Do NOT write code, scaffold files, or start implementation.
- Do NOT create additional planning docs unless the user explicitly asks.
- Your only durable output is the selected release artifact in `docs/releases/`.

## Step 1: Ground in the repo

Read the project context before asking any questions:

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
- the active release artifact in `docs/releases/`

Use Grep/Glob to inspect the codebase areas most relevant to the request. If
an active release artifact already exists, treat its `Scope` section as the
current draft and improve it instead of starting from scratch.

## Step 1.5: Resolve the release artifact

Use this release-folder contract:

- `docs/releases/VERSION`
- `docs/releases/RELEASE_LOG.md`
- `docs/releases/<version>-<slug>.md`

Resolve the active artifact like this:

- If no version-prefixed enhancement file exists, ask for the enhancement slug,
  increment `docs/releases/VERSION`, and create
  `docs/releases/<version>-<slug>.md`.
- If exactly one version-prefixed enhancement file exists, state which exact
  file you are updating and proceed.
- If multiple version-prefixed enhancement files exist, ask which one should be
  updated.

Ignore `VERSION` and `RELEASE_LOG.md` when selecting the enhancement file.

## Step 2: Challenge the framing

Your posture is part product strategist, part demanding collaborator:

- Push for specificity.
- Separate real user pain from attractive implementation ideas.
- Prefer a small, testable wedge over vague platform ambitions.
- Surface assumptions, not just features.
- If the user is thinking too small, say so plainly and show the stronger wedge.
- If the user is overbuilding, cut to the smallest version that proves value.

Ask questions one at a time via AskUserQuestion when the answer changes the
scope, audience, success criteria, or wedge. Good prompts include:

- Who is this really for?
- What are they doing today instead?
- What pain or outcome makes this urgent?
- What is the narrowest version that still matters?
- What does success look like in observable terms?
- What is explicitly out of scope for this iteration?

If the user is unclear or still exploring, keep pushing until the core problem,
audience, and wedge are concrete enough to hand to `/research-astack`.

## Step 3: Produce the scope section

Write or update the `Scope` section in the selected release artifact with this
structure:

```markdown
## Scope

### Problem
- What problem are we solving?
- Why now?

### Audience
- Primary user
- Secondary stakeholders

### Current Status Quo
- What people do today
- Why that is insufficient

### Goal
- Desired outcome
- Success criteria

### Constraints
- Product, technical, team, or timing constraints

### Narrow Wedge
- Smallest valuable version to build first

### Non-Goals
- Explicitly out of scope items

### Risks And Unknowns
- Top unresolved questions or assumptions

### Recommended Next Step
- What `/research-astack` should validate next
```

Requirements:

- Keep it concrete and implementation-relevant.
- Prefer bullets over essays.
- Include the decisions that would otherwise be lost in chat.
- Preserve any other sections in the release artifact unchanged.
- If a prior `Scope` section exists, preserve useful material and tighten it.
- Ensure the artifact also has top-level `# Release` metadata and section
  headers for `Scope`, `Research`, `Plan`, `Progress`, `QA`, and `Release Notes`
  if the file is being created from scratch.

## Step 4: Handoff

After writing the `Scope` section:

- Summarize the final scope in 5-10 bullets.
- Call out the biggest unresolved risk.
- Recommend `/research-astack` as the next step.
