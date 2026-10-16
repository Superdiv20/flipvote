# Flipvote

Realtime planning poker for agile teams. Users create a room, share the link, vote with hidden cards, and the facilitator flips them. No account needed. Hosted as a SaaS and self-hostable via Docker.

## Stack

- **Runtime / package manager:** Bun (workspaces, one `bun.lock` in the root)
- **Backend:** Bun (`Bun.serve()` with native WebSockets and pub/sub), no framework
- **Frontend:** Angular (always the latest version), Spartan UI (brain/helm) on Tailwind
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
- After changing anything in `packages/protocol`, restart the web dev server. Angular doesn't watch files outside `apps/web`, so it keeps serving the old version (the Bun server's `--watch` picks changes up by itself).

## Realtime protocol

- The server is the single source of truth. Clients send intents (`join`, `vote`, `flip`, `reset`); the server validates them and broadcasts the full room state.
- **Vote values never leave the server before the flip.** Before the flip, clients only receive `hasVoted: boolean` per participant. This is a hard rule, not an optimization.
- Every message type lives in `packages/protocol` as a discriminated union (`ClientMessage`, `ServerMessage`). Add new messages there first, then implement both sides.
- Rooms map to Bun pub/sub topics (`ws.subscribe(roomId)`, `server.publish(roomId, …)`). The `state` published there is the same for everyone in the room; personal data goes to the one client only: its seat in `welcome`, its own vote in `welcome` and `myVote`. `myVote` goes to a per-seat topic (`roomId:participantId`), so every tab of the same seat gets it. Use `server.publish`, not `ws.publish`, which skips the sender.
- Guest identity is a session token stored in the browser, so a page refresh rejoins the same seat.
- Presence: Bun pings idle sockets and closes dead ones (`idleTimeout`). When a seat's last tab closes, the seat shows as away; after a 30 s grace period the participant is removed, and if they were the facilitator, the role is handed over to another participant. Coming back within the grace period keeps the seat and the vote.

## Frontend conventions

- Standalone components, zoneless change detection, signals for all state. No NgModules, no RxJS-based state stores.
- Component APIs use `input()` / `output()` signal functions.
- File names follow the current Angular style guide without type suffixes: `poker-table.ts` with class `PokerTable`.
- Structure is feature-based and flat:

```
apps/web/src/app/
  core/          # app-wide singletons without UI (socket, session, config)
  features/
    landing/     # landing page (`/`), create-room form
    room/        # room page, room store, table, seats, card hand, results
  shared/        # used by 2+ features only (playing card, logo, deck definitions)
```

- Only `/` (the landing page) is prerendered at build time; every other route renders in the browser (`app.routes.server.ts`, `outputMode: "static"`). Code that runs on `/` or at app start must not assume a browser: no `window`, `localStorage` or `matchMedia` without a guard (`SessionService` and `ThemeService` already handle this). Browser-only work goes in `afterNextRender`.
- `RoomStore` is provided in `RoomPage`'s `providers`, not in the route or in root, so each room visit gets a fresh store. Route `providers` live as long as the router does, so the next visit would get the previous room's store.
- `room-page` is the only room component that injects the store. Child components are presentational (inputs/outputs only).
- Never name an output after a native DOM event (`select`, `reset`, `submit`, `input`, `change`, …). A bubbling DOM event of that name reaches the parent's `(name)` binding as well, so the handler gets an `Event` instead of the output's value.
- Move something into `shared/` only when a second feature needs it. Split `features/room/` into subfolders only once it grows past ~15 files.
- The WebSocket service in `core/` knows nothing about rooms; it sends `ClientMessage`s and exposes incoming `ServerMessage`s.
- `SessionService` in `core/` is the only code that touches `localStorage` (guest token, name, language, theme). Everything else goes through it.

### i18n

- Runtime translation with Transloco (English and German), set up in `core/i18n.ts`. `LanguageService` picks the language (the stored choice, else German if the browser is German, else English), switches it without a reload, and keeps `<html lang>` in sync.
- Translation files are `apps/web/public/i18n/en.json` and `de.json`, bundled as lazy chunks (not fetched over HTTP, so they also work while prerendering). English is the fallback. Add every key to both files.
- Keys are nested by feature and component, English and descriptive: `room.issues.addPlaceholder`, `room.results.average`, `common.cancel`. Shared wording goes under `common.`, form validation under `forms.`.
- No hardcoded user-facing text in `src/app`, including aria-labels, tooltips, placeholders and toasts. Templates use `| transloco`. Host bindings and TS code use `translateSignal()` or `TranslocoService.translate()`.
- Keys that are built in TS (lookup tables, validator messages) are wrapped in `marker()` from `@jsverse/transloco-keys-manager/marker`, so the keys manager can find them. Validators put the **key** into `message`; the template translates it.
- Messages use ICU syntax (MessageFormat plugin): `{count, plural, one {# vote} other {# votes}}`, `{status, select, …}`. Never build sentences by concatenating strings. Transloco also reads `{{x}}` as its own interpolation, so never write `{{` inside an ICU message.
- Numbers are formatted per language with `translocoDecimal` or ICU `{n, number}`, not Angular's `DecimalPipe`.
- Server error codes map to `errors.<CODE>`, with `errors.UNKNOWN` as the fallback (`shared/error-keys.ts`). The server and the protocol stay language-agnostic.
- Card values are not translated; the labels around them are.
- `bun run i18n:check` (in `apps/web`) fails on missing or unused keys. Specs get the real translations through `src/test-providers.ts`.

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

## Docker

- Multi-stage build: build Angular, then copy the static output (`dist/web/browser`) into an `oven/bun` runtime image.
- Bun serves `index.html` (the prerendered landing page) for `/` only. The SPA fallback for every other path must be `index.csr.html`, not `index.html`, or the browser tries to hydrate the landing page's markup on a room page.
- The image must include `packages/protocol` alongside `apps/server`, since the server resolves it via `tsconfig` paths.
