---
name: research-astack
version: 1.0.0
description: |
  Repository and dependency research for implementation planning. Reads
  `00-scope.md`, maps the current system, identifies reusable code and external
  constraints, and writes `01-research.md`. Use when asked to "research this",
  "map the codebase", or "figure out what already exists before we plan".
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - Write
  - Edit
  - AskUserQuestion
  - WebSearch
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
_TEL=$(~/.claude/skills/astack/bin/astack-config get telemetry 2>/dev/null || true)
_TEL_PROMPTED=$([ -f ~/.astack/.telemetry-prompted ] && echo "yes" || echo "no")
_TEL_START=$(date +%s)
_SESSION_ID="$$-$(date +%s)"
echo "TELEMETRY: ${_TEL:-off}"
echo "TEL_PROMPTED: $_TEL_PROMPTED"
mkdir -p ~/.astack/analytics
echo '{"skill":"research-astack","ts":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","repo":"'$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "unknown")'"}'  >> ~/.astack/analytics/skill-usage.jsonl 2>/dev/null || true
for _PF in ~/.astack/analytics/.pending-*; do [ -f "$_PF" ] && ~/.claude/skills/astack/bin/astack-telemetry-log --event-type skill_run --skill _pending_finalize --outcome unknown --session-id "$_SESSION_ID" 2>/dev/null || true; break; done
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

If `TEL_PROMPTED` is `no` AND `LAKE_INTRO` is `yes`: After the lake intro is handled,
ask the user about telemetry. Use AskUserQuestion:

> Help astack get better! Community mode shares usage data (which skills you use, how long
> they take, crash info) with a stable device ID so we can track trends and fix bugs faster.
> No code, file paths, or repo names are ever sent.
> Change anytime with `astack-config set telemetry off`.

Options:
- A) Help astack get better! (recommended)
- B) No thanks

If A: run `~/.claude/skills/astack/bin/astack-config set telemetry community`

If B: ask a follow-up AskUserQuestion:

> How about anonymous mode? We just learn that *someone* used astack — no unique ID,
> no way to connect sessions. Just a counter that helps us know if anyone's out there.

Options:
- A) Sure, anonymous is fine
- B) No thanks, fully off

If B→A: run `~/.claude/skills/astack/bin/astack-config set telemetry anonymous`
If B→B: run `~/.claude/skills/astack/bin/astack-config set telemetry off`

Always run:
```bash
touch ~/.astack/.telemetry-prompted
```

This only happens once. If `TEL_PROMPTED` is `yes`, skip this entirely.

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

## Telemetry (run last)

After the skill workflow completes (success, error, or abort), log the telemetry event.
Determine the skill name from the `name:` field in this file's YAML frontmatter.
Determine the outcome from the workflow result (success if completed normally, error
if it failed, abort if the user interrupted).

**PLAN MODE EXCEPTION — ALWAYS RUN:** This command writes telemetry to
`~/.astack/analytics/` (user config directory, not project files). The skill
preamble already writes to the same directory — this is the same pattern.
Skipping this command loses session duration and outcome data.

Run this bash:

```bash
_TEL_END=$(date +%s)
_TEL_DUR=$(( _TEL_END - _TEL_START ))
rm -f ~/.astack/analytics/.pending-"$_SESSION_ID" 2>/dev/null || true
~/.claude/skills/astack/bin/astack-telemetry-log \
  --skill "SKILL_NAME" --duration "$_TEL_DUR" --outcome "OUTCOME" \
  --used-browse "USED_BROWSE" --session-id "$_SESSION_ID" 2>/dev/null &
```

Replace `SKILL_NAME` with the actual skill name from frontmatter, `OUTCOME` with
success/error/abort, and `USED_BROWSE` with true/false based on whether `$B` was used.
If you cannot determine the outcome, use "unknown". This runs in the background and
never blocks the user.

# /research-astack

You are running the `/research-astack` workflow. This is a **plan-mode research pass**
that turns the scoped request into implementation context. Your only durable
output is `01-research.md`.

## Hard Gates

- Do NOT write implementation code.
- Do NOT turn this into a plan yet.
- Prioritize correctness over completeness, and completeness over noise
  reduction.
- Do NOT include raw code dumps, verbose grep/glob logs, or exploratory notes
  that are not useful for review.
- Your job is discovery, constraint mapping, and recommendation.

## Step 1: Read the scope

Read `00-scope.md` first. If it does not exist, say so explicitly and either:

- use the user’s request as a temporary scope input, or
- recommend running `/scope-astack` first if the request is still ambiguous.

Then read, if present:

- `README.md`
- `CLAUDE.md`
- `TODOS.md`
- `DESIGN.md`
- `01-research.md`
- `02-plan.md`

## Step 2: Research the implementation landscape

Inspect the codebase and map the relevant system:

- entrypoints
- routes/pages
- services/modules
- data models/types
- existing tests
- prior patterns worth reusing

If the task depends on external libraries, APIs, or specs, read the relevant
docs or source references. Prefer primary sources and official docs.

Use disciplined exploration. Keep verbose discovery work compact and only carry
forward distilled findings that planning will need.

When important ambiguity remains, ask focused questions. Otherwise discover
facts through reading and inspection before asking.

## Step 3: Write `01-research.md`

Write or update `01-research.md` in the repo root with this structure:

```markdown
# Research

## Scope Baseline
- Short summary of the scoped task

## Relevant Files
- Exact file paths
- Why each file matters

## Current System Map
- Key files, modules, flows, and ownership boundaries

## Reuse Opportunities
- Existing code or patterns we should build on

## External References
- Libraries, APIs, docs, or standards that matter

## Constraints
- Technical, product, platform, or dependency constraints

## Risks
- High-risk areas or likely integration failures

## Assumptions To Validate
- Facts we are not fully certain about yet
- Questions a human should confirm before planning

## Unknowns
- Open questions that planning must resolve

## Recommended Direction
- Best path into `/plan-astack`
```

Requirements:

- Keep the artifact compact and reviewable.
- Cite concrete files, modules, or URLs where relevant.
- Keep it implementation-oriented.
- Distinguish facts from inference.
- Do not paste raw code unless a tiny excerpt is necessary to explain a risk.
- If a prior `01-research.md` exists, update it instead of duplicating it.

## Step 4: Handoff

After writing `01-research.md`:

- Summarize the top reuse opportunities.
- Call out the most important risk.
- Call out the most important assumption that still needs validation.
- If the research is still materially uncertain or incomplete, say another
  research pass is needed before `/plan-astack`.
- Recommend `/plan-astack` only when the research is accurate enough to serve as a
  planning input.
