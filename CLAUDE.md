# astack development

## Commands

```bash
bun install
bun test
bun run test:evals
bun run test:e2e
bun run build
bun run gen:skill-docs
bun run gen:skill-docs --host codex
bun run gen:skill-docs --host copilot
bun run skill:check
bun run dev <cmd>
```

`test:evals` requires the relevant external auth for the eval runners.

On Windows, `setup` requires Node.js in addition to Bun because Playwright
verification uses Node there.

## Project structure

```text
astack/
├── browse/                 # Headless browser runtime, CLI, and tests
├── scope/                  # /scope skill
├── architecture/           # /architecture skill
├── research/               # /research skill
├── plan/                   # /plan skill
├── roadmap/                # /roadmap skill
├── implement/              # /implement skill
├── review/                 # /review skill
├── qa/                     # /qa skill
├── qa-only/                # /qa-only skill
├── ship/                   # /ship skill
├── document-release/       # /document-release skill
├── retro/                  # /retro skill
├── design-consultation/    # /design-consultation skill
├── design-review/          # /design-review skill
├── investigate/            # /investigate skill
├── careful/                # /careful skill
├── freeze/                 # /freeze skill
├── guard/                  # /guard skill
├── unfreeze/               # /unfreeze skill
├── astack-upgrade/         # /astack-upgrade skill
├── scripts/                # generators, analytics, DX tooling
├── test/                   # validation, routing, eval, and harness tests
├── .agents/skills/         # generated Codex-style sidecar skills
├── SKILL.md.tmpl           # root skill template
└── setup                   # install + registration entrypoint
```

## Workflow artifacts

astack uses a release-folder artifact contract:

- `docs/releases/VERSION`
- `docs/releases/RELEASE_LOG.md`
- `docs/releases/<version>-<slug>.md`

The versioned release artifact contains the workflow sections:

- `Scope`
- `Architecture`
- `Research`
- `Plan`
- `Progress`
- `QA`
- `Release Notes`

Roadmap outputs live separately under `docs/roadmaps/<slug>.md` as one document
with a summary section followed by release sections. This keeps future roadmap
planning separate from the shipped `docs/releases/` contract.

These replace the older hidden planning files under `~/.astack/projects/` for
the main implementation lifecycle. Skills that plan, review, QA, ship, and
document releases should treat the active release artifact as the source of
truth.

Planning skills should auto-create or reuse `enhancement/<slug>` when the work
starts on `main`, and `/ship-astack` should ask once whether to merge the PR
before cleaning up the branch and returning to `main`.

The architecture workflow should write the full technical design to
`docs/architecture/` and keep a short pointer summary in the active release
artifact so the rest of the workflow can find it easily.

The `end-to-end` enhancement is the first version of an unattended path across
the whole workflow. It should be able to take one request from scope through
ship, docs sync, merge prompt, and local cleanup while still stopping for any
human judgment, branch conflict, or clearly non-transient failure.

Host-specific install and naming rules live in `docs/host-support.md`.

## Template workflow

SKILL docs are generated.

1. Edit the relevant `.tmpl` file.
2. Run `bun run gen:skill-docs`.
3. Run `bun run gen:skill-docs --host codex`.
4. Run `bun run gen:skill-docs --host copilot` when the skill belongs in the
   Copilot workflow surface.
5. Commit the template and every generated host output affected by the change.

## Platform-agnostic rules

- Never hardcode framework-specific commands when the repo can be inspected.
- Read project instructions before asking for missing conventions.
- Persist reusable project-specific answers in repo docs when appropriate.

## Browser interaction

Use `/browse-astack` or the browse binary directly for browser automation. Do not use
other browser MCP integrations in this repo.

## Local contributor state

astack contributor-only local state can live under:

- `~/.astack-dev/evals/`
- `~/.astack-dev/plans/`

These are local only and not checked into the repo.
