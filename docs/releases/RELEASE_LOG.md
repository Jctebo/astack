# Release Log

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
