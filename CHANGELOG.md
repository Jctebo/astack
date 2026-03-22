# Changelog

## [0.9.5.1] - 2026-03-22

### Changed

- Changed generated astack skills so telemetry is no longer part of the default
  execution contract for Claude, Codex, or Copilot installs.
- Changed the skill-doc generator to stop emitting telemetry prompts, telemetry
  preambles, local analytics writes, and end-of-skill telemetry epilogues.

### Fixed

- Fixed Windows and Codex skill runs to avoid telemetry helper execution as a
  normal part of generated skill usage.
- Fixed safety-mode skills like `/careful-astack`, `/freeze-astack`,
  `/guard-astack`, and `/unfreeze-astack` so they no longer append analytics
  events during ordinary activation or hook handling.

## [0.9.5.0] - 2026-03-21

### Added

- Added first-class GitHub Copilot skill generation and install support for the
  base planning workflow: `/scope-astack`, `/research-astack`,
  `/plan-astack`, and `/implement-astack`.
- Added [docs/host-support.md](docs/host-support.md) as the normalized
  reference for host install roots, canonical skill naming, and current Copilot
  support boundaries.

### Changed

- Changed Codex and Copilot generated skill folders to use canonical
  `*-astack` names such as `plan-astack` instead of legacy `astack-*` sidecar
  names.
- Changed `setup` to install slim runtime roots for Codex and Copilot, link
  generated host skills by basename, and clean up stale legacy sidecars.
- Changed contributor-facing docs to point at the normalized host contract
  instead of temporary enhancement workflow folders.

### Fixed

- Fixed Windows setup detection so `browse.exe` is accepted and Node.js is
  checked up front for the Playwright verification path.
- Fixed generator, validation, telemetry, and routing expectations so tests and
  docs consistently use the canonical `*-astack` command names.

### Removed

- Removed the temporary `enhancement/renameskills` and
  `enhancement/support-github-copilot` workflow folders now that their durable
  outcomes are captured in the main project docs.

## 0.3.3

Initial astack fork release.

### Highlights

- Rebranded the project, generated skills, binaries, config paths, and docs
  from `gstack` to `astack`.
- Replaced the old planning workflow with four canonical commands:
  `/scope-astack`, `/research-astack`, `/plan-astack`, and `/implement-astack`.
- Standardized the repo-root workflow artifacts:
  `00-scope.md`, `01-research.md`, `02-plan.md`, and `03-progress.md`.
- Updated downstream skills like `/review-astack`, `/qa-astack`, `/ship-astack`, and
  `/document-release-astack` to align with the new artifact flow.
- Renamed the updater to `/astack-upgrade-astack` and pointed upgrade behavior at the
  astack fork instead of upstream gstack.

### Notes

- astack preserves upstream attribution and license notices as a fork of
  `gstack`.
- This repo is the source of truth for future astack workflow changes.
