# Onboarding Guide

An introduction to this codebase for someone new to Angular: how the app is put together, the
Angular concepts it uses, and how to make changes. For setup and commands, see also the
[README](README.md).

## Contents

1. [What the app does](#1-what-the-app-does)
2. [Running it](#2-running-it)
3. [How an Angular app starts up](#3-how-an-angular-app-starts-up)
4. [Core Angular concepts](#4-core-angular-concepts)
5. [How the folders fit together](#5-how-the-folders-fit-together)
6. [Making changes](#6-making-changes)
7. [Cheat sheet](#7-cheat-sheet)
8. [Tips and next steps](#8-tips-and-next-steps)

---

## 1. What the app does

Relic Tracker is a small Angular app for tracking Warframe prime parts and void relics. It has two
pages, switched with the nav bar:

- **Prime Items** (`/items`): every prime item and its parts. You count the parts you own, mark items
  as built, and see which relics drop each part you still need.
- **Relics** (`/relics`): every relic. You track how many you own and filter, for example to "has
  parts I need" or "unvaulted only".

There's no backend. The game data is a static JSON file
([public/data/warframe-data.json](public/data/warframe-data.json)), and your progress is saved in
the browser's `localStorage`.

## 2. Running it

The project runs inside Docker, so you don't need Node installed:

- **VS Code (recommended):** install the **Dev Containers** extension, then run
  **Dev Containers: Reopen in Container** from the command palette. In the VS Code terminal, run
  `npm start -- --host 0.0.0.0 --poll 1000` and open http://localhost:4200.
- **Without VS Code integration:** run `docker compose up`, then open http://localhost:4200.

The dev server has live reload: save a file and the browser updates.

| Command               | What it does                                               |
| --------------------- | ---------------------------------------------------------- |
| `npm start`           | Dev server with live reload                                |
| `npm test`            | Unit tests (Vitest)                                        |
| `npm run build`       | Production build into `dist/`                              |
| `npm run update-data` | Re-download the game data and regenerate the JSON file     |

## 3. How an Angular app starts up

Read these files in this order:

| File                                                 | Role                                                                                         |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [src/index.html](src/index.html)                     | The single HTML page. It contains `<app-root>`, a placeholder that Angular fills in.         |
| [src/main.ts](src/main.ts)                           | The entry point. `bootstrapApplication(App, appConfig)` starts Angular.                      |
| [src/app/app.config.ts](src/app/app.config.ts)       | App-wide setup ("providers"): the router and the HTTP client.                                |
| [src/app/app.routes.ts](src/app/app.routes.ts)       | URL → page mapping. `/items` loads `ItemsPage` and `/relics` loads `RelicsPage`.             |
| [src/app/app.ts](src/app/app.ts) + [app.html](src/app/app.html) | The root component: header, nav, footer, and a `<router-outlet />` where the current page appears. |

Other files at the root you'll see but rarely touch:

- [angular.json](angular.json): build settings for the Angular CLI (entry file, styles, assets).
- `tsconfig*.json`: TypeScript compiler settings.
- `package.json`: dependencies and the `npm` scripts above.

## 4. Core Angular concepts

### Components

Components are the building blocks. Each one is a TypeScript class (logic) plus an HTML template
(view) plus a stylesheet. Take [item-card.ts](src/app/items/item-card.ts):

```ts
@Component({
  selector: 'app-item-card',          // used in HTML as <app-item-card>
  imports: [Counter, RouterLink],     // other components/directives this template uses
  templateUrl: './item-card.html',
  styleUrl: './item-card.scss',       // styles only apply to this component
})
export class ItemCard {
  readonly item = input.required<PrimeItem>();   // data passed in from the parent
}
```

The parent page uses it like this: `<app-item-card [item]="item" />`.

If a template uses another component (like `<app-counter>`), that component must be listed in
`imports`. Forgetting this is a common beginner error.

### Signals

Signals are how state works here. A signal is a value that Angular watches. When it changes,
anything that depends on it updates automatically.

- `signal(x)` is a value you can change: `search.set('ash')` or `count.update((n) => n + 1)`.
- `computed(() => ...)` is a value derived from other signals, and recalculates by itself. For
  example, `filteredItems` in [items-page.ts](src/app/items/items-page.ts) depends on `search`,
  `category` and `hideComplete`.
- `effect(() => ...)` runs a side effect whenever its signals change.
  [progress.service.ts](src/app/data/progress.service.ts) uses one to save to `localStorage`.
- `linkedSignal(() => ...)` is like `computed`, but you can also set it yourself. The relics page
  uses it so the search box starts from the `?q=` URL parameter but stays editable.
- `input()` and `model()` are signals too: `input()` receives data from a parent, and `model()` is
  an input that can also send changes back up. See [counter.ts](src/app/shared/counter.ts).

To read a signal you call it like a function: `search()`, `item().name`.

### Template syntax

In the `.html` files:

| Syntax                                       | Meaning                                                               |
| -------------------------------------------- | --------------------------------------------------------------------- |
| `{{ item().name }}`                          | Display a value                                                       |
| `[checked]="built()"`                        | Property binding: data goes into the element                          |
| `(click)="doSomething()"`                    | Event binding: data comes out of the element                          |
| `[(ngModel)]="search"`                       | Two-way binding: the input box and the signal stay in sync            |
| `[class.complete]="complete()"`              | Add the CSS class `complete` when the value is true                   |
| `@if (cond) { } @else { }`                   | Show something conditionally                                          |
| `@for (x of list; track x.id) { } @empty { }` | Repeat for each item; `@empty` shows when the list is empty          |
| `{{ date \| date: 'medium' }}`               | A pipe: formats a value for display                                   |

### Services and dependency injection

Services hold shared logic and state. They're marked `@Injectable({ providedIn: 'root' })`, which
means one instance is shared by the whole app. Components get them with `inject(...)`:

```ts
protected readonly progress = inject(ProgressService);
```

This app has two:

- [warframe-data.service.ts](src/app/data/warframe-data.service.ts) loads
  `public/data/warframe-data.json` with `httpResource` and builds lookups from it, such as "which
  relics drop this part".
- [progress.service.ts](src/app/data/progress.service.ts) holds your progress (part counts, built
  flags, relic counts) and saves it to `localStorage`.

### Routing

[app.routes.ts](src/app/app.routes.ts) maps URLs to page components. `loadComponent` means a page's
code is only downloaded the first time you visit it. Links use `routerLink="/relics"` instead of
`href`, so the page changes without a full reload.

`withComponentInputBinding()` in [app.config.ts](src/app/app.config.ts) turns URL parameters into
component inputs. That's how a link to `/relics?q=Lith A1` fills in the `q` input on the relics page.

## 5. How the folders fit together

```
src/app/
  data/        ← models (TypeScript types) + the two services. The "brain".
  items/       ← items-page (filters + grid)  →  item-card (one item)
  relics/      ← relics-page (filters + grid) →  relic-card (one relic)
  shared/      ← counter.ts: reusable "− 3 +" button, used by both cards
scripts/
  update-data.mjs  ← Node script that builds the game data JSON (not Angular code)
public/
  data/warframe-data.json  ← the generated game data, served as a static file
```

Data flows down and events flow up:

1. A page reads data from the services and filters it.
2. It passes each entry to a card through an input: `[item]="item"`.
3. When you click `+` in a counter, it emits `(valueChange)`, and the card calls
   `progress.setPartCount(...)`.
4. That updates the progress signal, so every view that depends on it re-renders, and the `effect`
   saves the progress.

The data itself comes from [scripts/update-data.mjs](scripts/update-data.mjs). It downloads
Warframe's Public Export and writes the JSON file. You only rerun it (`npm run update-data`) after a
game update.

## 6. Making changes

### Changing text or layout

Edit the `.html` file. For example, the header and footer are in [app.html](src/app/app.html).

### Changing styling

Colours and app-wide styles are in [src/styles.scss](src/styles.scss). Styles for a single component
are in its own `.scss` file and only affect that component.

### Example: adding a filter

Say you want an "Only farmable now" checkbox on the Items page. It would show items that still need
a part you can get from an unvaulted relic.

1. In [items-page.ts](src/app/items/items-page.ts), add the state and a helper (also import
   `PrimeItem` from `../data/models`):

   ```ts
   protected readonly onlyFarmable = signal(false);

   private canFarm(item: PrimeItem): boolean {
     return item.parts.some(
       (part) =>
         this.progress.isPartNeeded(item, part) &&
         (this.data.sourcesByPart().get(part.id) ?? []).some((s) => !s.relic.vaulted),
     );
   }
   ```

2. Add a condition to the `filteredItems` filter:
   `&& (!this.onlyFarmable() || this.canFarm(item))`.

3. In [items-page.html](src/app/items/items-page.html), add the checkbox to the toolbar:

   ```html
   <label><input type="checkbox" [(ngModel)]="onlyFarmable" /> Only farmable now</label>
   ```

Because `filteredItems` is a `computed`, nothing else has to change: the list updates when you tick
the box.

### Adding a new page

1. Generate it: `npx ng generate component wishlist/wishlist-page`. This creates the `.ts`, `.html`,
   `.scss` and test files.
2. Add a route to [app.routes.ts](src/app/app.routes.ts), copying the existing pattern:

   ```ts
   {
     path: 'wishlist',
     title: 'Wishlist | Relic Tracker',
     loadComponent: () => import('./wishlist/wishlist-page').then((m) => m.WishlistPage),
   },
   ```

   Put it above the `'**'` route, which catches every unknown URL.

3. Add a link to the nav in [app.html](src/app/app.html):
   `<a routerLink="/wishlist" routerLinkActive="active">Wishlist</a>`.

### Adding a new kind of saved progress

Add a field to the `Progress` interface in
[progress.service.ts](src/app/data/progress.service.ts), plus a default value in `loadProgress()`,
along with getter and setter methods like the existing ones. It's saved automatically.

Note that the setters create a new object (`{ ...s, ... }`) rather than modifying the existing one.
Signals only notice a change when they get a new value, so keep that pattern.

### Using more game data

For example, to show ducat values:

1. Add the field in [scripts/update-data.mjs](scripts/update-data.mjs) and run
   `npm run update-data`.
2. Add it to the types in [models.ts](src/app/data/models.ts).
3. Display it in a template.

### Checking your change

- Watch the browser and the terminal running `npm start`. Template and type errors show up in both.
- Run `npm test`. If you change behaviour, update or add a test next to the file
  (`*.spec.ts`).
- Your saved progress lives in `localStorage`. To reset it, open the browser dev tools →
  Application → Local Storage and delete the `relic-tracker.progress` key.

## 7. Cheat sheet

```ts
// State in a component or service
readonly count = signal(0);
count();                         // read
count.set(5);                    // write
count.update((n) => n + 1);      // write based on the current value
readonly doubled = computed(() => this.count() * 2);

// Component inputs/outputs
readonly item = input.required<PrimeItem>();   // <app-x [item]="..." />
readonly label = input('');                    // optional, with a default
readonly value = model(0);                     // <app-x [(value)]="..." />

// Get a service
private readonly progress = inject(ProgressService);
```

Generating code:

```sh
npx ng generate component path/name    # new component
npx ng generate service path/name      # new service
```

## 8. Tips and next steps

- Install the **Angular Language Service** extension (the Dev Container includes it). It gives you
  autocomplete and error checking inside the `.html` templates.
- Look at the tests ([progress.service.spec.ts](src/app/data/progress.service.spec.ts),
  [app.spec.ts](src/app/app.spec.ts)) to see how the services are used.
- The end of the [README](README.md) lists suggested next steps, roughly in order of difficulty:
  import/export progress, an `/items/:id` detail page, ducat values, refinement odds.
- The official tutorial and guides at https://angular.dev cover each of these concepts in more depth.
