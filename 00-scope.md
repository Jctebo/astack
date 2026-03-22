# Scope

## Problem
- The core astack workflow now uses repo-root scope, research, planning, and progress artifacts, but the docs do not clearly credit the external workflow material that informed that direction.
- The rationale for separating research from planning is currently spread across commit history and skill text instead of being captured in a small, durable repo artifact.

## Audience
- Primary user: contributors and maintainers evolving the core astack workflow.
- Secondary stakeholders: users evaluating why astack's artifact-driven process looks the way it does.

## Current Status Quo
- People can see the shipped workflow changes in the repo, but they cannot easily tell which outside ideas helped shape them.
- Attribution currently depends on chat context or commit archaeology, which is easy to lose.

## Goal
- Add a lightweight, durable scope artifact for this docs-only change.
- Credit the DeepWiki research and planning phase writeups as influences on the core workflow changes.
- Keep README, contributor docs, and architecture notes aligned around that attribution.

## Constraints
- This is a documentation-only pass; it should not change workflow behavior.
- Attribution should be precise about influence without implying the astack workflow is a copy.
- Keep the wedge small and easy to review on a dedicated docs branch.

## Narrow Wedge
- Create `00-scope.md` for this documentation update.
- Update the main docs to mention that the research and planning phase material from HumanLayer's DeepWiki informed the core workflow changes, especially the research-before-plan split and durable planning artifacts.

## Non-Goals
- No skill logic changes.
- No expansion into a full historical essay about astack's evolution.
- No version bump for a docs-only attribution pass.

## Risks And Unknowns
- Over-crediting could imply tighter coupling than intended.
- Under-crediting could make the acknowledgement feel buried or token.
- The best place for long-term discoverability is a docs judgment call, so the wording should stay concise and factual.

## Recommended Next Step
- Use `/document-release-astack` to keep the public docs and contributor docs consistent with this attribution change.
