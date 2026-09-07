---
name: backend-development-conventions
description: Apply backend-specific engineering conventions when implementing, refactoring, reviewing, or testing APIs, services, persistence, authentication, background jobs, integrations, or distributed workflows. Use alongside general project conventions.
---

# Backend Development Conventions

Build backend changes that preserve contracts, data integrity, security, and operational visibility while conforming to the repository's architecture.

Apply `$development-conventions` as the baseline when it is available. This skill specializes backend decisions and does not authorize unrelated infrastructure or production changes.

## Understand the system boundary

Before editing, trace the request through the relevant layers: transport or consumer, validation, application logic, domain rules, persistence, and external integrations. Inspect schemas, migrations, API specifications, authorization rules, retry behavior, and nearby tests that define the contract.

Identify which boundaries are public or compatibility-sensitive. Do not infer permission to change an API, database schema, event shape, access rule, or deployment configuration merely because code changes require inspection of it.

## Preserve contracts

- Validate untrusted input at the boundary and return stable, useful errors without exposing internals.
- Keep transport concerns separate from business rules and persistence details when the repository already uses those boundaries.
- Maintain backward compatibility for APIs, events, stored data, and configuration unless a breaking change is explicit.
- For HTTP APIs, follow the repository's status-code, error-envelope, pagination, filtering, idempotency, and versioning conventions.
- Update schemas or API documentation when an externally observable contract changes.

## Protect data and access

- Enforce authentication and authorization server-side at every relevant resource boundary. Distinguish identity from permission.
- Use parameterized queries or the repository's safe data-access layer; never construct queries from untrusted strings.
- Select and return only needed fields. Avoid logging credentials, tokens, secrets, or sensitive payloads.
- Preserve transaction boundaries and invariants. Consider concurrency, duplicate delivery, partial failure, and retry behavior for writes.
- Use explicit time zones, units, identifiers, nullability, and numeric precision appropriate to the domain.

## Evolve persistence safely

When a schema or stored representation changes:

1. Prefer additive, backward-compatible evolution when rolling deployment or mixed versions are possible.
2. Separate schema change, backfill, traffic transition, and cleanup when combining them would create lock, rollback, or compatibility risk.
3. Assess indexes, query plans, table size, lock duration, and reversible recovery before proposing a migration.
4. Never run a production migration, destructive data operation, or backfill without explicit authorization.

Keep migrations deterministic and consistent with the repository's migration framework. Test both new installations and upgrades when the project supports them.

## Design for failure

- Set bounded timeouts for network and blocking operations using local conventions.
- Retry only transient, safe operations; use bounded backoff and preserve idempotency.
- Treat external systems as unreliable and map their failures to controlled internal behavior.
- For queues and jobs, define acknowledgement, deduplication, poison-message, and retry semantics rather than assuming exactly-once execution.
- Do not introduce caches without a clear ownership, invalidation, expiry, and consistency model.

## Make behavior observable

Use existing structured logging, metrics, and tracing facilities. Add telemetry at meaningful boundaries and failure points, with correlation identifiers where supported. Avoid high-cardinality labels and sensitive values. Ensure health signals reflect actual dependency and readiness semantics rather than always returning success.

## Verify backend behavior

Add tests at the cheapest level that proves the contract:

- Unit tests for domain rules and error paths.
- Integration tests for database behavior, serialization, authorization, transactions, and framework wiring.
- Contract or end-to-end tests only where cross-boundary behavior cannot be proven more narrowly.

Include relevant negative cases such as invalid input, forbidden access, missing records, conflicts, duplicate requests, dependency timeouts, or rollback behavior. Use the repository's prescribed lint, type, test, migration, and build checks. Never claim production safety from unit tests alone.

## Hand off backend changes

Report the affected contract, persistence or migration impact, security considerations, verification performed, and any rollout or observability requirement. Clearly distinguish implemented safeguards from recommendations that still require authorization.
