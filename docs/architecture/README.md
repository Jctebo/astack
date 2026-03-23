# Architecture Docs

This folder is the canonical home for durable architecture documentation in astack.

## Purpose

Use architecture docs here when a project or subsystem needs an early technical
shape before implementation starts.

## Expected Contents

An architecture doc should usually cover:

- problem and scope
- system shape
- major components and responsibilities
- data flow and integration points
- deployment and operational assumptions
- tradeoffs
- open questions and risks
- next-step handoff

## Template

See [template-example.md](template-example.md) for a copyable starting point
when you need a first-pass architecture document.

## Naming

Name the file for the scope of the request.

- broad project architecture: use a project-level name
- subsystem architecture: use a subsystem-level name
- feature architecture: use a feature-level name

Keep the name descriptive and stable for the work it captures.
