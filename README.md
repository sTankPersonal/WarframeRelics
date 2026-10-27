# Relic Tracker

An Angular app for tracking Warframe prime parts and void relics, built on
[Warframe's Public Export](https://warframe.fandom.com/wiki/Public_Export).

- **Prime Items**: every prime warframe, weapon, archwing and companion, with the parts each one
  needs. Count the parts you own, or mark the item built. Each part you still need lists the relics
  that drop it (unvaulted first). Click a relic to jump to it.
- **Relics**: all Lith/Meso/Neo/Axi relics. Track how many you own, and filter to relics that
  contain parts you still need, unvaulted relics, and so on.

Progress is saved in your browser's `localStorage`.

## Running it (Docker, no Node install needed)

Node and the Angular CLI run inside a container, so the only thing you need is Docker Desktop.

### Option A: VS Code Dev Container (recommended for development)

1. Install the **Dev Containers** extension in VS Code.
2. Open this folder, then run **Dev Containers: Reopen in Container** from the command palette.
3. In the VS Code terminal (which now runs inside the container):
   ```sh
   npm start -- --host 0.0.0.0 --poll 1000
   ```
4. Open http://localhost:4200.

With this option, IntelliSense, `ng generate`, tests and so on all work as though Node were
installed locally.

### Option B: Docker Compose only

```sh
docker compose up        # installs dependencies, then serves at http://localhost:4200
docker compose down      # stop
```

To run other commands, use `docker compose run --rm dev <command>`, e.g.
`docker compose run --rm dev npx ng generate component foo`.

> `node_modules` lives in a Docker volume, not in this folder, because installing over a Windows
> bind mount is very slow. If your editor complains that it can't find `@angular/core`, use the
> Dev Container option.

## Commands

| Command               | What it does                                                    |
| --------------------- | --------------------------------------------------------------- |
| `npm start`           | Dev server with live reload                                     |
| `npm test`            | Unit tests (Vitest)                                             |
| `npm run build`       | Production build into `dist/`                                   |
| `npm run update-data` | Re-download the Public Export and regenerate the game data file |

## How the data works

The browser can't use the Public Export directly. The index is LZMA-compressed, the files are
large, and the server doesn't send CORS headers. Instead, [scripts/update-data.mjs](scripts/update-data.mjs)
downloads the exports and writes a small, app-friendly
[public/data/warframe-data.json](public/data/warframe-data.json), which the app loads with
`httpResource`. The generated file is committed, so the app works without running the script.
Rerun it after game updates.

The export has no "vaulted" flag, so the script also reads
[DE's official drop tables](https://www.warframe.com/droptables): a relic counts as unvaulted if it
drops from anything right now. Relics only available from Prime Resurgence (Varzia) show as vaulted.

## Project layout

```
src/app/
  data/
    models.ts                  Types for the game data
    warframe-data.service.ts   Loads the JSON (httpResource) + derived lookups (computed)
    progress.service.ts        Your tracked progress: signals + localStorage
  items/                       Prime Items page + item card
  relics/                      Relics page + relic card
  shared/counter.ts            Reusable +/- stepper (model() two-way binding)
  app.routes.ts                Lazy-loaded routes
  app.config.ts                Providers: router, HttpClient
scripts/update-data.mjs        Public Export -> public/data/warframe-data.json
```

## Angular concepts to look at

- **Standalone components** with `input()`, `model()` and `inject()`.
- **Signals**: `signal`, `computed`, `effect`, and `linkedSignal` (see the relics page search box).
- **Control flow**: `@if`, `@for`, `@empty` in templates.
- **Routing**: lazy `loadComponent`, `routerLink` with `queryParams`, and
  `withComponentInputBinding()`, which turns `?q=Lith A1` into the relics page's `q` input.
- **HTTP**: `httpResource` for loading data, and `HttpTestingController` in [app.spec.ts](src/app/app.spec.ts).

## Ideas for next steps

- Import/export progress as a JSON file (back it up, or move it between browsers).
- An item detail page at `/items/:id` (practice with route params).
- Ducat values: the export includes `primeSellingPrice` on parts.
- Show relic refinement odds (Intact / Exceptional / Flawless / Radiant).
- Replace `ngModel` in the toolbars with Angular's signal-based forms.
