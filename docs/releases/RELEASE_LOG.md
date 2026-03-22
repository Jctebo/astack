# Release Log

## [0.9.5.4] - 2026-03-22

### Added
- Branch lifecycle automation for new enhancements: planning skills now bootstrap `enhancement/<slug>` from `main`, and ship now asks whether to merge the PR before cleaning up the branch and returning to `main`.

### Changed
- Ship workflow docs and generated skill outputs now describe the merge-confirmation step, branch cleanup, and return-to-main behavior.
- Planning workflow docs now describe the automatic enhancement-branch bootstrap when work starts on `main`.

## [0.9.5.3] - 2026-03-22

### Changed
- Converged astack's machine-facing version contract onto `docs/releases/VERSION` and `docs/releases/RELEASE_LOG.md`.
- Update checks now fetch the remote version from `main/docs/releases/VERSION` and runtime telemetry reads the same release-folder metadata.
- Upgrade guidance and contributor docs now describe `docs/releases/` as the only canonical release source of truth.

### Fixed
- Runtime roots now materialize release metadata under `docs/releases/` instead of copying repo-root `VERSION` and `CHANGELOG.md`.
- The upgrade flow now compares installed and vendored versions using release-folder metadata and summarizes changes from the shipped release log.
- Review guidance and update-check tests no longer depend on repo-root release files.

## [0.9.5.2] - 2026-03-22

### Changed
- Codex upgrades now resolve the primary source checkout from the user-home runtime root instead of guessing from repo-local `.agents/skills/astack` copies.
- Codex install documentation now explains that the checkout used to run `setup --host codex` remains the upgrade source of truth.

### Fixed
- Runtime roots now carry `VERSION`, `CHANGELOG.md`, and `.astack-source-path` metadata so update and upgrade flows can identify the installed build correctly.
- Legacy Codex installs where `~/.codex/skills/astack` is itself a git checkout are preserved instead of being treated like disposable runtime roots.

## [0.9.5.1] - 2026-03-22

### Added
- Introduced a canonical `docs/releases/` workflow contract with one versioned enhancement file per workstream.
- Added release-folder artifacts for version tracking and summarized release history.

### Changed
- Migrated astack's workflow skills, generated host outputs, contributor docs, and tests away from repo-root numbered planning files.
- Updated `/ship-astack` and `/document-release-astack` to treat the active enhancement record as the archival source of truth and rewrite it into shipped documentation.

### Fixed
- Aligned readiness dashboards, workflow guidance, and observability fixtures with the consolidated release-artifact model.
