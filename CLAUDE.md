# Flipvote

Realtime planning poker for agile teams. Users create a room, share the link, vote with hidden cards, and the facilitator flips them. No account needed. Hosted as a SaaS and self-hostable via Docker.

## Stack

- **Runtime / package manager:** Bun (workspaces, one `bun.lock` in the root)
- **Backend:** Bun (`Bun.serve()` with native WebSockets and pub/sub), no framework
- **Frontend:** Angular (always the latest version), Spartan UI (brain/helm) on Tailwind
- **Persistence:** in-memory room state; completed rounds saved to SQLite via `bun:sqlite`
- **Deployment:** single Docker image (Bun serves API, WebSocket and the built Angular app)

## Repo layout

```
apps/
  server/        # @flipvote/server — Bun backend
  web/           # @flipvote/web — Angular app
packages/
  protocol/      # @flipvote/protocol — shared WebSocket message types
docs/
  design/        # exported design mockups (reference for UI work)
```

## Commands

Run from the repo root:

- `bun install` — install all workspaces
- `bun dev` — run server (localhost:3000) and web (localhost:4200) in parallel
- `bun dev:server` / `bun dev:web` — run one app

## Workspace rules

- `@flipvote/protocol` is **not** a package dependency anywhere. Both apps resolve it via `compilerOptions.paths` in their `tsconfig.json`, pointing at `packages/protocol/src/index.ts`. Bun honors `paths` at runtime, Angular at build time.
- Never add `workspace:*` dependencies. Angular/Spartan generators run npm internally, and npm fails on the `workspace:` protocol.
- If a generator creates `package-lock.json` or nested `node_modules`, delete them and run `bun install` from the root. `bun.lock` in the root is the only lockfile.
- The protocol package exports TypeScript source directly. No build step.

## Realtime protocol

- The server is the single source of truth. Clients send intents (`join`, `vote`, `flip`, `reset`); the server validates them and broadcasts the full room state.
- **Vote values never leave the server before the flip.** Before the flip, clients only receive `hasVoted: boolean` per participant. This is a hard rule, not an optimization.
- Every message type lives in `packages/protocol` as a discriminated union (`ClientMessage`, `ServerMessage`). Add new messages there first, then implement both sides.
- Rooms map to Bun pub/sub topics (`ws.subscribe(roomId)`, `server.publish(roomId, …)`).
- Guest identity is a session token stored in the browser, so a page refresh rejoins the same seat.
- Presence via heartbeat; disconnected users are removed after a grace period. If the facilitator leaves, facilitator role is handed over to another participant.

## Frontend conventions

- Standalone components, zoneless change detection, signals for all state. No NgModules, no RxJS-based state stores.
- Component APIs use `input()` / `output()` signal functions.
- File names follow the current Angular style guide without type suffixes: `poker-table.ts` with class `PokerTable`.
- Structure is feature-based and flat:

```
apps/web/src/app/
  core/          # app-wide singletons without UI (socket, session, config)
  features/
    landing/     # landing page, create-room form
    room/        # room page, room store, table, seats, card hand, results
  shared/        # used by 2+ features only (playing card, logo, deck definitions)
```

- `RoomStore` is provided in the room route's `providers`, not in root, so each room visit gets a fresh store.
- `room-page` is the only room component that injects the store. Child components are presentational (inputs/outputs only).
- Move something into `shared/` only when a second feature needs it. Split `features/room/` into subfolders only once it grows past ~15 files.
- The WebSocket service in `core/` knows nothing about rooms; it sends `ClientMessage`s and exposes incoming `ServerMessage`s.

## UI

- Spartan helm components are generated into `apps/web/libs/ui` and treated as vendored code. Prefer composing them over editing them.
- Build the playing cards, the table and the card hand as custom components. They are the product's identity.
- Design direction: minimal and calm, neutral slate palette with a single accent color, rounded corners, soft shadows, no gradients. Light and dark mode. The flip is the one moment that gets animation.

## Git conventions

- Commit directly to `main` during MVP development; short-lived branches only for experiments or when a PR is useful.
- Use Conventional Commits: `feat:` (user-facing functionality), `fix:`, `chore:`, `refactor:`, `docs:`, `build:`, `ci:`.
- The app has a single version (no per-package versions). Releases will be automated later via release-please; tags trigger the Docker image build.

## Roadmap

1. **MVP:** create room without account, join via link, vote, flip, new round. Fibonacci, modified Fibonacci and T-shirt decks. Facilitator role, spectator mode. Results: average, distribution, consensus indicator.
2. **Usability:** issue list per session with final estimates, round timer, custom decks, CSV export, robust reconnect.
3. **SaaS:** accounts, persistent teams, session history, billing (feature-flagged off in self-hosted builds).
4. **Integrations:** import issues from Jira, Azure DevOps, GitHub; write estimates back.

## Docker

- Multi-stage build: build Angular, then copy the static output into an `oven/bun` runtime image.
- The image must include `packages/protocol` alongside `apps/server`, since the server resolves it via `tsconfig` paths.
- Configuration via environment variables; SQLite database on a mounted volume.
