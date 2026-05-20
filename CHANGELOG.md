# Changelog

All notable changes to `@daytona/n8n-nodes-daytona` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] — Initial release

First public release. Hybrid-style n8n community node implementing 12 operations across 4 resources for Daytona.

### Added

#### Sandbox resource (7 operations)

- **Create** — Create a sandbox from either a **Snapshot** (pre-built template ID/name) or an **Image** (Docker image reference like `python:3.11`). Snapshot takes precedence if both are set, matching Daytona's Python SDK. Optional name, ephemeral flag, and advanced options (CPU/memory/disk, target region, env vars, labels, network policy, auto-stop/archive/delete intervals). Optional poll-until-`started` with configurable timeout. CPU/memory/disk are only sent when creating from an Image (snapshot-based creates inherit the snapshot's resource specs).
- **Get** — Fetch a single sandbox by ID.
- **Get Many** — List sandboxes with optional limit or full pagination.
- **Delete** — Permanently delete a sandbox by ID.
- **Start** — Start a stopped sandbox with optional wait-until-started.
- **Stop** — Stop a running sandbox with optional wait-until-stopped.
- **Get Preview URL** — Generate a public preview URL for a port exposed inside a sandbox. Supports Signed URLs (token embedded, default, browser-friendly) and Standard URLs (token returned separately for use via `x-daytona-preview-token` header).

#### Code resource (2 operations)

- **Run Code** — Execute Python, JavaScript, or TypeScript inside a sandbox. Optionally creates an ephemeral sandbox just for this execution (auto-deleted afterward) when **Use Ephemeral Sandbox** is checked. Supports environment variables, argv, and configurable timeout.
- **Run Command** — Execute a shell command inside a sandbox. Optionally creates an ephemeral sandbox. Supports working directory, environment variables, and timeout.

Output: `{ exitCode, result, artifacts, sandboxId, ephemeral }`. `result` is stdout and stderr combined. Branch on `$json.exitCode` for success/failure — non-zero exit codes are returned as data, not thrown as errors.

#### File resource (2 operations)

- **Upload** — Upload a binary file from an n8n binary field to a sandbox path. Multipart form upload with content-type preservation.
- **Download** — Download a file from a sandbox path and emit it as binary output. Filename derivation from `Content-Disposition` header with RFC 5987 fallback.

#### Git resource (1 operation)

- **Clone** — Clone a Git repository into a sandbox path. Supports branch, commit ID pinning, and HTTPS basic auth (username + password / personal access token) for private repositories.

#### Snapshot resource (6 operations)

- **Create** — Create a snapshot from a Docker image with optional resource specs (CPU/memory/disk), region, and entrypoint (comma-separated string converted to array). Optional poll-until-`active` with configurable timeout (default 600s — snapshot creation pulls + builds the Docker image, which can take minutes for large images).
- **Get** — Fetch a snapshot by ID or name.
- **Get Many** — List snapshots with optional name filter, sort (`createdAt`/`lastUsedAt`/`name`/`state`), and order (`asc`/`desc`).
- **Delete** — Delete a snapshot.
- **Activate** — Mark a snapshot active so it becomes usable for sandbox creation. Optional poll-until-`active` with configurable timeout (default 120s).
- **Deactivate** — Mark a snapshot inactive. Optional poll-until-`inactive` with configurable timeout (default 120s).

#### Volume resource (4 operations)

- **Create** — Create a persistent volume that can be mounted into sandboxes.
- **Get** — Fetch a volume by ID or name.
- **Get Many** — List volumes with optional `includeDeleted` flag.
- **Delete** — Delete a volume.

Mount volumes into sandboxes via the **Volume Mounts** field on `Sandbox.Create` (Additional Fields). Each entry takes `volumeId`, `mountPath`, and optional `subpath` for partial mounts.

#### Sandbox.Create — snapshot dropdown

The **Snapshot** field on Sandbox.Create renders as a dropdown populated by `methods.loadOptions.getSnapshots` (queries `GET /snapshots` with `sort=lastUsedAt&order=desc`, up to 100 entries). Includes a "(Use Daytona Default)" entry for empty value. Switch to expression mode for dynamic values.

#### Credentials

- **Daytona API** credential type with three fields:
  - `apiKey` (required, masked) — Bearer token created at [app.daytona.io/dashboard/keys](https://app.daytona.io/dashboard/keys).
  - `baseUrl` (default `https://app.daytona.io/api`) — Override for self-hosted Daytona instances.
  - `organizationId` (optional) — Sent as the `X-Daytona-Organization-ID` header. Required only for JWT tokens or multi-org API keys.
- Credential test request validates against `GET /api-keys/current`.

### Architecture

- **Hybrid pattern** — Declarative `description` block defines the UI; programmatic `execute()` handles control flow with one operation file per resource × operation under `nodes/Daytona/actions/`. Modeled on YepCode's verified community node structure.
- **Shared transport layer** in `nodes/Daytona/helpers/transport.ts` encapsulates Daytona's two-step toolbox URL indirection (`GET /sandbox/{id}` → `toolboxProxyUrl` → `{toolboxProxyUrl}/{sandboxId}{operationPath}`) with per-execution caching. The cache is invalidated on Start, Stop, and Delete so subsequent calls re-fetch the proxy URL after state changes.
- **Self-hosted compatible** — All API and toolbox URLs are derived from runtime credentials and `toolboxProxyUrl` responses; no hard-coded production URLs in operation logic.
- **AI-agent-friendly** — Node is marked `usableAsTool: true` so it appears as a tool in n8n's AI Agent integrations.

### Tooling

- Scaffolded with `@n8n/node-cli` 0.29.1 in strict mode (n8n Cloud compatible).
- TypeScript strict mode, ES2019 target, CommonJS modules.
- Vitest integration test suite covering all 12 operations end-to-end against the real Daytona API. Run with `npm test`; ephemeral tests opt-in via `DAYTONA_TEST_INCLUDE_EPHEMERAL=1`.
- GitHub Actions CI on PR/push (lint + build) and on tag (release with npm provenance attestation via OIDC).
- MIT license, zero runtime dependencies.

[Unreleased]: https://github.com/daytona/n8n-nodes-daytona/compare/0.1.0...HEAD
[0.1.0]: https://github.com/daytona/n8n-nodes-daytona/releases/tag/0.1.0
