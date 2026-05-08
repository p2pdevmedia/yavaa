# Tests

## Required test coverage
- Smoke tests for app boot/auth handshake.
- Integration test for DB connection and migration state.
- Contract test for OpenAPI build step.

## Determinism requirements
- Use stable fixtures/seeds.
- Cover valid, invalid, and permission-denied paths.
- Keep tests independent and repeatable.
