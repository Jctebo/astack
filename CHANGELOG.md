# Changelog

## 0.3.3

Initial astack fork release.

### Highlights

- Rebranded the project, generated skills, binaries, config paths, and docs
  from `gstack` to `astack`.
- Replaced the old planning workflow with four canonical commands:
  `/scope`, `/research`, `/plan`, and `/implement`.
- Standardized the repo-root workflow artifacts:
  `00-scope.md`, `01-research.md`, `02-plan.md`, and `03-progress.md`.
- Updated downstream skills like `/review`, `/qa`, `/ship`, and
  `/document-release` to align with the new artifact flow.
- Renamed the updater to `/astack-upgrade` and pointed upgrade behavior at the
  astack fork instead of upstream gstack.

### Notes

- astack preserves upstream attribution and license notices as a fork of
  `gstack`.
- This repo is the source of truth for future astack workflow changes.
