---
name: development-conventions
description: Apply project-aware software development conventions while implementing, refactoring, reviewing, or testing code in an existing repository. Use for general engineering work across languages and frameworks; combine with a domain-specific skill when one applies.
---

# Development Conventions

Produce changes that fit the repository, preserve behavior outside the request, and remain easy to review and maintain.

## Establish the local contract

Before editing, inspect the smallest useful set of repository guidance and nearby code:

- Read applicable `AGENTS.md`, contribution guides, manifests, formatter/linter settings, and test configuration.
- Trace the affected execution path and inspect adjacent tests before choosing an implementation.
- Treat explicit user instructions and repository rules as authoritative. Prefer established local patterns over generic preferences.
- If conventions conflict, follow the most specific instruction for the file or subsystem and mention any consequential ambiguity.

## Implement within scope

- Make the smallest cohesive change that fully satisfies the request.
- Preserve public behavior and compatibility unless the task explicitly changes them.
- Reuse existing abstractions when they fit; introduce a new abstraction only when it removes real duplication or clarifies an important boundary.
- Keep naming domain-oriented and consistent with neighboring code.
- Avoid unrelated cleanup, broad dependency upgrades, generated-file edits, or formatting churn.
- Do not overwrite user changes. Inspect the working tree and separate unrelated modifications from the task.

## Maintain code quality

- Keep functions and modules focused, with dependencies flowing through clear interfaces.
- Validate inputs at trust boundaries and handle failures deliberately; do not silently discard errors.
- Do not log secrets, credentials, tokens, or sensitive personal data.
- Add comments for non-obvious constraints and tradeoffs, not to narrate straightforward code.
- Update user-facing documentation, examples, configuration, and types when the changed contract requires it.
- Add dependencies only when their maintenance and security cost is justified by a concrete benefit.

## Verify the change

Choose checks from repository evidence rather than inventing a new workflow:

1. Add or update tests for changed behavior, including a relevant failure or boundary case.
2. Run the narrowest relevant tests first, then the project-prescribed broader checks when practical.
3. Run the configured formatter, linter, type checker, and build steps that cover the changed files.
4. Inspect the final diff for accidental changes, exposed secrets, stale comments, and incomplete contract updates.

Never claim a check passed unless it was run successfully. If a check cannot run, report the exact command and blocker.

## Hand off

Lead with the resulting behavior. Summarize important files or decisions, list verification performed, and disclose remaining risks or unverified assumptions. Do not present unrelated pre-existing failures as caused by the change.

## Domain routing

For server-side APIs, services, persistence, background jobs, authentication, or distributed systems, also apply `$backend-development-conventions`. Its backend-specific guidance takes precedence only where it is more specific.
