# Onboarding Guide

An introduction to this codebase for someone new to Angular: how the app is put together, the
Angular concepts it uses, and how to make changes. For setup and commands, see also the
[README](README.md).

You don't need to read it all at once. Sections 1–3 get you running and oriented, section 4 is the
concepts you'll meet in every file, and section 6 has step-by-step examples to follow when you make
a change. Come back to sections 7–10 when you're stuck.

## Contents

1. [What the app does](#1-what-the-app-does)
2. [Running it](#2-running-it)
3. [How an Angular app starts up](#3-how-an-angular-app-starts-up)
4. [Core Angular concepts](#4-core-angular-concepts)
5. [How the folders fit together](#5-how-the-folders-fit-together)
6. [Making changes](#6-making-changes)
7. [TypeScript you'll see](#7-typescript-youll-see)
8. [Troubleshooting](#8-troubleshooting)
9. [Cheat sheet](#9-cheat-sheet)
10. [Glossary](#10-glossary)
11. [Tips and next steps](#11-tips-and-next-steps)
12. [Ideas to build yourself](#12-ideas-to-build-yourself)

---

## 1. What the app does

Relic Tracker is a small Angular app for tracking Warframe prime parts and void relics. It has two
pages, switched with the nav bar:

- **Prime Items** (`/items`): every prime item and its parts. You count the parts you own, mark items
  as built, and see which relics drop each part you still need.
- **Relics** (`/relics`): every relic. You track how many you own and filter, for example to "has
  parts I need" or "unvaulted only".

There's no backend (no server or database of our own). The game data is a static JSON file
([public/data/warframe-data.json](public/data/warframe-data.json)) that the browser downloads like
an image, and your progress is saved in the browser's `localStorage`, a small key/value store
every browser provides for each website. That means progress is per browser: open the app in
another browser and it starts empty.

## 2. Running it

The project runs inside Docker, so you don't need Node installed on your computer. Node, npm and the
Angular CLI all live inside a container (a small Linux machine that Docker runs for you).

- **VS Code (recommended):** install the **Dev Containers** extension, then run
  **Dev Containers: Reopen in Container** from the command palette (`Ctrl+Shift+P`). VS Code
  reconnects *inside* the container, so its terminal, autocomplete and tests all run there. In the
  VS Code terminal, run `npm start -- --host 0.0.0.0 --poll 1000` and open http://localhost:4200.
- **Without VS Code integration:** run `docker compose up`, then open http://localhost:4200. To run
  any other command, prefix it with `docker compose run --rm dev`, for example
  `docker compose run --rm dev npm test`.

What the extra `npm start` options mean:

- `--host 0.0.0.0` lets your browser (outside the container) reach the server (inside it).
- `--poll 1000` checks for changed files every second. File-change notifications don't reliably
  cross from Windows into the container, so without it, saving a file might not reload the page.

The dev server has live reload: save a file and the browser updates. Leave it running in one
terminal and open a second terminal (**Terminal → New Terminal**) for other commands.

| Command               | What it does                                               |
| --------------------- | ---------------------------------------------------------- |
| `npm start`           | Dev server with live reload                                |
| `npm test`            | Unit tests (Vitest)                                        |
| `npm run build`       | Production build into `dist/`                              |
| `npm run update-data` | Re-download the game data and regenerate the JSON file     |

These are shortcuts defined in the `scripts` section of [package.json](package.json). For example,
`npm start` really runs `ng serve`.

## 3. How an Angular app starts up

When you open http://localhost:4200, this happens:

1. The browser loads [src/index.html](src/index.html). It's almost empty: just an `<app-root>` tag.
2. The browser runs the compiled code, starting from [src/main.ts](src/main.ts).
3. `bootstrapApplication(App, appConfig)` starts Angular. It finds the `<app-root>` tag and replaces
   it with the `App` component, using the settings in `appConfig`.
4. `App` renders the header, nav and footer. In the middle is `<router-outlet />`, a slot where the
   router puts whichever page matches the URL.
5. The router reads the URL. `/` redirects to `/items`, so it loads `ItemsPage` into the outlet.
6. Meanwhile, `WarframeDataService` downloads the game data JSON. Until it arrives, `App` shows
   "Loading game data…" instead of the outlet.

Read these files in that order:

| File                                                 | Role                                                                                         |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [src/index.html](src/index.html)                     | The single HTML page. It contains `<app-root>`, a placeholder that Angular fills in.         |
| [src/main.ts](src/main.ts)                           | The entry point. `bootstrapApplication(App, appConfig)` starts Angular.                      |
| [src/app/app.config.ts](src/app/app.config.ts)       | App-wide setup ("providers"): the router and the HTTP client.                                |
| [src/app/app.routes.ts](src/app/app.routes.ts)       | URL → page mapping. `/items` loads `ItemsPage` and `/relics` loads `RelicsPage`.             |
| [src/app/app.ts](src/app/app.ts) + [app.html](src/app/app.html) | The root component: header, nav, footer, and a `<router-outlet />` where the current page appears. |

Angular is a "single-page application" framework: there's only ever one HTML page. Clicking a nav
link doesn't load a new page from a server; the router swaps which component is shown and updates
the URL.

Other files at the root you'll see but rarely touch:

- [angular.json](angular.json): build settings for the Angular CLI (entry file, styles, the
  `public/` folder to copy, size limits).
- `tsconfig*.json`: TypeScript compiler settings.
- [package.json](package.json): dependencies (libraries the app uses) and the `npm` scripts above.
  `package-lock.json` records their exact versions; don't edit it by hand.
- `node_modules/`: the installed libraries. Never edit it; `npm install` recreates it.
- `dist/`: output of `npm run build`. Generated, so don't edit it either.

## 4. Core Angular concepts

### Components

Components are the building blocks. A component is a piece of the screen with its own logic, view
and styles, made of a TypeScript class (logic), an HTML template (view), and a stylesheet. Take
[item-card.ts](src/app/items/item-card.ts):

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

`@Component({...})` is a *decorator*: it attaches Angular settings to the class that follows it.

- **`selector`** is the custom HTML tag for this component. The parent page uses it like this:
  `<app-item-card [item]="item" />`. All selectors in this project start with `app-`.
- **`imports`** lists every other component or directive the template uses. If a template uses
  `<app-counter>`, then `Counter` must be in `imports`, or Angular reports "is not a known element".
  This is the most common beginner error.
- **`templateUrl` / `styleUrl`** point to the HTML and SCSS files. Small components can instead put
  them inline with `template:` and `styles:`, as [counter.ts](src/app/shared/counter.ts) does.
- Component styles are **scoped**: a `.card` rule in `item-card.scss` only affects the item card,
  even though the relic card also has a `.card` class.

Inside the class you'll see `private`, `protected` and `readonly`:

- `private`: only the class's own code can use it. Not even its template can.
- `protected`: the class and its template can use it. Used here for values the template displays.
- No keyword (public): anyone can use it, including parent components. Inputs are public.
- `readonly`: the property can't be reassigned. With signals that's fine, because you change a
  signal's *value* with `.set()`, not by replacing the signal itself.

### Signals

Signals are how state works here. A signal is a box holding a value that Angular watches. When the
value changes, anything that read it (a template, a `computed`, an `effect`) updates automatically.
You never have to tell the page to re-render.

- **`signal(x)`** is a value you can change:
  ```ts
  readonly search = signal('');   // starts as an empty string
  search();                       // read it → ''
  search.set('ash');              // replace the value
  count.update((n) => n + 1);     // change it based on the current value
  ```
- **`computed(() => ...)`** is a value derived from other signals. Angular remembers which signals
  the function read, and recalculates only when one of them changes. For example, `filteredItems` in
  [items-page.ts](src/app/items/items-page.ts) reads `search`, `category`, `hideComplete` and the
  item data, so typing in the search box recalculates the list. You can't `.set()` a computed.
- **`effect(() => ...)`** runs code for its side effect whenever the signals it reads change.
  [progress.service.ts](src/app/data/progress.service.ts) uses one to write progress to
  `localStorage` every time it changes. Use effects sparingly; most of the time you want `computed`.
- **`linkedSignal(() => ...)`** is like `computed`, but you can also set it yourself. The relics
  page uses it so the search box starts from the `?q=` URL parameter but stays editable. If the URL
  changes again, it resets to the new value.
- **`input()`** and **`model()`** are signals too: `input()` receives data from a parent, and
  `model()` is an input that can also send changes back up. See
  [counter.ts](src/app/shared/counter.ts).

To read a signal you **call it like a function**: `search()`, `item().name`. Forgetting the `()` is
a common mistake (see [Troubleshooting](#8-troubleshooting)).

Signals only notice a change when they receive a *new* value. That's why the services build a new
object with `{ ...s, ... }` instead of modifying the existing one; see
[Adding a new kind of saved progress](#adding-a-new-kind-of-saved-progress).

### Template syntax

Templates are HTML with extra Angular syntax. Inside the special syntax you can use the component's
`protected` and public properties and methods directly, without `this.`.

| Syntax                                       | Meaning                                                               |
| -------------------------------------------- | --------------------------------------------------------------------- |
| `{{ item().name }}`                          | Display a value as text                                               |
| `[checked]="built()"`                        | Property binding: set an element property from a value                |
| `(click)="doSomething()"`                    | Event binding: run code when the event happens                        |
| `[(ngModel)]="search"`                       | Two-way binding: the input box and the signal stay in sync            |
| `[class.complete]="complete()"`              | Add the CSS class `complete` when the value is true                   |
| `[attr.aria-label]="..."`                    | Set an HTML attribute (used for things that aren't element properties) |
| `@if (cond) { } @else { }`                   | Show something conditionally                                          |
| `@for (x of list; track x.id) { } @empty { }` | Repeat for each item; `@empty` shows when the list is empty          |
| `{{ date \| date: 'medium' }}`               | A pipe: formats a value for display                                   |

Some details worth knowing:

- **Square brackets mean "this is code".** `[target]="part.count"` passes the *number* in
  `part.count`. Without brackets, `target="part.count"` would pass the literal *text* "part.count".
- **`$event`** inside an event binding is the value the event produced. For `(valueChange)` on the
  counter, it's the new number. For a DOM event like `(change)`, it's the browser's event object.
- **`$any(...)`** in [item-card.html](src/app/items/item-card.html) tells TypeScript "don't check the
  type of this". It's a shortcut used to read `.checked` from a checkbox event.
- **`track`** in `@for` tells Angular how to recognise each item between updates (usually by its
  `id`), so it can update only the rows that changed instead of rebuilding the whole list.
- **`[(ngModel)]`** comes from `FormsModule`, which is why the two pages list `FormsModule` in their
  `imports`.

### Inputs and outputs: how components talk

Components pass data **down** to children through inputs, and children send events **up** to
parents through outputs.

```html
<!-- in item-card.html: the card (parent) uses the counter (child) -->
<app-counter
  [value]="progress.partCount(part.id)"                    ← down: current count
  (valueChange)="progress.setPartCount(part.id, $event)"   ← up: new count when clicked
  [target]="part.count"
  [label]="part.name" />
```

[counter.ts](src/app/shared/counter.ts) declares `value = model(0)`. A `model()` creates both an
input called `value` and an output called `valueChange`. When the counter's `+` button calls
`value.set(...)`, Angular fires `valueChange` with the new number, and the card saves it.

Because the input and output names match that pattern, a parent could also write the short form
`[(value)]="someSignal"`. The card doesn't, because it needs to call a service method instead.

### Services and dependency injection

A service is a plain class for logic or state that isn't tied to one piece of the screen. Services
are marked `@Injectable({ providedIn: 'root' })`, which means Angular creates one instance and
shares it with the whole app. Components ask for it with `inject(...)`:

```ts
protected readonly progress = inject(ProgressService);
```

This is *dependency injection*: the component doesn't create the service with `new`, it asks
Angular for it. Because every component gets the same instance, a part count changed on the Items
page is immediately visible on the Relics page.

This app has two:

- [warframe-data.service.ts](src/app/data/warframe-data.service.ts) loads
  `public/data/warframe-data.json` with `httpResource` and builds lookups from it, such as "which
  relics drop this part". `httpResource` makes the request and exposes the result as signals:
  `value()`, `isLoading()` and `error()`.
- [progress.service.ts](src/app/data/progress.service.ts) holds your progress (part counts, built
  flags, relic counts) in one signal and saves it to `localStorage`. Components never touch that
  signal directly; they call methods like `partCount()` and `setPartCount()`. Keeping all the rules
  in one place means every page agrees on what "needed" or "complete" means.

### Routing

[app.routes.ts](src/app/app.routes.ts) maps URLs to page components:

```ts
{
  path: 'items',                         // the URL: /items
  title: 'Prime Items | Relic Tracker',  // the browser tab title
  loadComponent: () => import('./items/items-page').then((m) => m.ItemsPage),
},
```

- `loadComponent` *lazy-loads* the page: its code is only downloaded the first time you visit it,
  which makes the app start faster. The string in `import('...')` is the file path, without `.ts`.
- `{ path: '', redirectTo: 'items' }` sends `/` to `/items`.
- `{ path: '**', redirectTo: 'items' }` catches every other URL. Routes are checked top to bottom,
  so it must stay last.

Links use `routerLink="/relics"` instead of `href`, so the router switches the page without a full
reload. `routerLinkActive="active"` adds the `active` class to the link of the current page, which
is how the nav highlights where you are.

`withComponentInputBinding()` in [app.config.ts](src/app/app.config.ts) turns URL parameters into
component inputs. That's how a link to `/relics?q=Lith A1` fills in the `q` input on the relics page.
The relic chips on item cards create those links with `[queryParams]="{ q: source.relic.id }"`.

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

Each page is split into a **page** component and a **card** component. The page owns the toolbar
and filters and decides *which* things to show; the card shows *one* thing. That keeps each file
small, and the card doesn't need to know anything about filtering.

### Following one click through the code

What happens when you click `+` next to "Ash Prime Blueprint":

1. **counter.ts**: the button's `(click)` runs `value.set(value() + 1)`. Because `value` is a
   `model()`, this fires the `valueChange` output with the new number, say `1`.
2. **item-card.html**: the card is listening with
   `(valueChange)="progress.setPartCount(part.id, $event)"`, so it calls the service with `1`.
3. **progress.service.ts**: `setPartCount` creates a new progress object with the new count and
   stores it with `this.state.update(...)`.
4. The `state` signal changed, so everything that read it is updated:
   - the `effect` writes the new progress to `localStorage`;
   - the counter shows `1/1` in green, because `[value]="progress.partCount(part.id)"` is re-read;
   - the part is no longer needed, so its relic list disappears (`@if (progress.isPartNeeded(...))`);
   - the page's `completeCount` and `filteredItems` recalculate.

None of those updates are wired up by hand. They happen because each one read the signal.

The data itself comes from [scripts/update-data.mjs](scripts/update-data.mjs). It downloads
Warframe's Public Export and writes the JSON file. You only rerun it (`npm run update-data`) after a
game update. The app never talks to Warframe's servers itself.

## 6. Making changes

A general approach for any change:

1. **Find where it lives.** Something you can see on screen is in a `.html` template; how it looks
   is in the matching `.scss`; how it behaves is in the `.ts`. Rules about progress are in
   `progress.service.ts`. Searching the project (`Ctrl+Shift+F`) for text you see on screen is a
   quick way to find the right template.
2. **Make a small change and save.** Check the browser and the `npm start` terminal for errors.
3. **Run `npm test`** when you've changed behaviour.

### Changing text or layout

Edit the `.html` file. For example, the header and footer are in [app.html](src/app/app.html), and
the toolbar of each page is at the top of its `-page.html` file.

### Changing styling

Colours and app-wide styles are in [src/styles.scss](src/styles.scss). It defines CSS variables like
`--success`, which components use with `var(--success)`; change a variable there and every component
using it follows. Styles for a single component are in its own `.scss` file and only affect that
component.

### Example: adding a filter

Say you want an "Only farmable now" checkbox on the Items page. It hides unfinished items whose
missing parts only drop from vaulted relics, so you see only what you can actually farm today.

**Step 1: add the state and a helper.** In [items-page.ts](src/app/items/items-page.ts), add
`PrimeItem` to the import from `../data/models`, then add inside the class:

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

- `onlyFarmable` is the checkbox state. It's `protected` because the template binds to it.
- `canFarm` is `private` because only the class uses it. In words: "is there **some** part that is
  still needed **and** dropped by **some** relic that isn't vaulted?"
- `sourcesByPart().get(part.id)` looks up the relics for that part. It can be `undefined` for a part
  no relic drops, so `?? []` substitutes an empty list.

**Step 2: use it in the filter.** Add one more condition to the end of the `filteredItems` filter:

```ts
&& (!this.onlyFarmable() || this.progress.isComplete(item) || this.canFarm(item))
```

It's a chain of "or" (`||`) checks, and the item is shown if **any** of them is true:

- `!this.onlyFarmable()`: the checkbox is off, so this filter does nothing.
- `this.progress.isComplete(item)`: the item is finished, so this filter leaves it alone.
- `this.canFarm(item)`: the item still needs a part that an unvaulted relic drops.

JavaScript stops at the first `true`, so `canFarm` only runs for unfinished items.

Why the `isComplete` check is needed: `isPartNeeded` returns `false` for every part of a built item
(and for parts you already own enough of). Without the check, `canFarm` would return `false` for
finished items and the filter would hide them. Hiding finished items is the job of the existing
"Hide complete" checkbox, so this filter should only judge unfinished ones. That way each checkbox
has one job, and you can combine them:

| Checkbox          | What it hides                                                            |
| ----------------- | ------------------------------------------------------------------------ |
| Hide complete     | Items that are built, or that have every part owned                      |
| Only farmable now | Unfinished items whose missing parts only drop from vaulted relics       |

**Step 3: add the checkbox.** In [items-page.html](src/app/items/items-page.html), add it to the
toolbar next to "Hide complete":

```html
<label><input type="checkbox" [(ngModel)]="onlyFarmable" /> Only farmable now</label>
```

**Why nothing else changes:** `filteredItems` is a `computed`, and it now reads `onlyFarmable()`.
Ticking the box changes that signal, so the list recalculates and the page updates.

**Check it:** tick **Only farmable now** and built items should stay visible. Tick
**Hide complete** as well and they should disappear.

### Adding a new page

This walks through adding a "Wishlist" page at `/wishlist`.

**Step 1: generate the component.** `ng generate` is the Angular CLI's tool for creating files from
a template. Instead of creating four files and typing the `@Component` setup by hand, you run one
command. Run it in a terminal inside the container (in VS Code: **Terminal → New Terminal**; it can
run alongside `npm start`), from the project folder `/app`:

```sh
npx ng generate component wishlist/wishlist-page --flat
```

| Part                     | Meaning                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| `npx`                    | Run a tool installed in this project (here, the Angular CLI, `ng`).                           |
| `ng generate component`  | "Make me a new component."                                                                    |
| `wishlist/wishlist-page` | Where and what. Relative to `src/app/`: a `wishlist` folder, holding a component `wishlist-page`. |
| `--flat`                 | Don't create an extra folder named after the component.                                       |

Without `--flat`, the files would go in `src/app/wishlist/wishlist-page/`, an extra level deeper
than `items/` and `relics/`, and the route path in step 2 wouldn't match.

If you use Docker Compose instead of the Dev Container, run it through the container:
`docker compose run --rm dev npx ng generate component wishlist/wishlist-page --flat`.

Tip: add `--dry-run` to any generate command to see what it *would* create without writing
anything. Run it again without the flag to do it for real.

The command creates:

```
src/app/wishlist/wishlist-page.ts      ← the class, named WishlistPage
src/app/wishlist/wishlist-page.html    ← the template, containing "<p>wishlist-page works!</p>"
src/app/wishlist/wishlist-page.scss    ← the styles (empty)
src/app/wishlist/wishlist-page.spec.ts ← a starter test that checks the component can be created
```

The `.ts` file is the bare minimum: a `@Component` with `selector: 'app-wishlist-page'`, an empty
`imports: []`, and an empty `WishlistPage` class. The CLI turns the dashed name `wishlist-page` into
the class name `WishlistPage`.

**Step 2: add a route.** In [app.routes.ts](src/app/app.routes.ts), copy the existing pattern:

```ts
{
  path: 'wishlist',
  title: 'Wishlist | Relic Tracker',
  loadComponent: () => import('./wishlist/wishlist-page').then((m) => m.WishlistPage),
},
```

Put it **above** the `'**'` route. Routes are checked top to bottom, and `'**'` matches everything,
so anything after it is never reached. The import path is relative to `app.routes.ts` and has no
`.ts` on the end; `m.WishlistPage` is the class name from the generated file.

At this point you can already visit http://localhost:4200/wishlist and see "wishlist-page works!".

**Step 3: add a link.** In the `<nav>` in [app.html](src/app/app.html):

```html
<a routerLink="/wishlist" routerLinkActive="active">Wishlist</a>
```

[app.spec.ts](src/app/app.spec.ts) checks that the nav has exactly 2 links, so `npm test` will fail
until you change that `toBe(2)` to `toBe(3)`. That's the test doing its job: it noticed the nav
changed.

**Step 4: give it content.** To show data, inject the services, just as the other pages do:

```ts
import { Component, inject } from '@angular/core';
import { ProgressService } from '../data/progress.service';
import { WarframeDataService } from '../data/warframe-data.service';

export class WishlistPage {
  protected readonly data = inject(WarframeDataService);
  protected readonly progress = inject(ProgressService);
}
```

Then use them in `wishlist-page.html`, for example `{{ data.items().length }} items`. To show item
cards, add `ItemCard` to `imports` (imported from `'../items/item-card'`) and use
`<app-item-card [item]="item" />` inside an `@for`.

### Adding a new kind of saved progress

Say you want to mark items as favourites. In
[progress.service.ts](src/app/data/progress.service.ts):

**Step 1:** add a field to the `Progress` interface, which describes the shape of the saved data:

```ts
/** itemId -> true if the user starred the item */
favorites: Record<string, boolean>;
```

`Record<string, boolean>` means "an object whose keys are strings and values are booleans", like
`{ "ash-prime": true }`.

**Step 2:** add it to the `empty` default in `loadProgress()`:

```ts
const empty: Progress = { parts: {}, built: {}, relics: {}, favorites: {} };
```

`loadProgress()` merges saved data over this default, so people whose saved progress predates the
new field get an empty `favorites` instead of `undefined`.

**Step 3:** add a getter and setter, copying the `isBuilt`/`setBuilt` pair:

```ts
isFavorite(itemId: string): boolean {
  return this.state().favorites[itemId] ?? false;
}

setFavorite(itemId: string, favorite: boolean): void {
  this.state.update((s) => ({ ...s, favorites: { ...s.favorites, [itemId]: favorite } }));
}
```

The setter builds a **new** object instead of changing the old one. Read
`{ ...s, favorites: {...} }` as "a copy of `s`, with `favorites` replaced". If you wrote
`this.state().favorites[itemId] = true` instead, the object would change but the signal would
still hold the *same* object, so Angular wouldn't see a change: nothing would re-render and nothing
would be saved.

Saving is automatic: the existing `effect` writes the whole `state` to `localStorage` whenever it
changes. Then call `progress.isFavorite(...)` and `progress.setFavorite(...)` from a template, the
same way the item card uses `isBuilt` and `setBuilt`.

### Using more game data

For example, to show ducat values (the export has `primeSellingPrice` on parts):

1. Add the field in [scripts/update-data.mjs](scripts/update-data.mjs) and run
   `npm run update-data`. Open the JSON file to check the field is there.
2. Add it to the types in [models.ts](src/app/data/models.ts), for example `ducats?: number;` on
   `ItemPart`. The `?` means it may be missing.
3. Display it in a template, such as `{{ part.ducats }}` in
   [item-card.html](src/app/items/item-card.html).

[models.ts](src/app/data/models.ts) only *describes* the JSON for TypeScript. Adding a field there
doesn't add data; the script has to put it in the file.

### Checking your change

- Watch the browser and the terminal running `npm start`. Template and type errors show up in both,
  with a file name and line number.
- Open the browser's dev tools (`F12`) and check the **Console** tab for runtime errors.
- Run `npm test`. If you change behaviour, update or add a test next to the file (`*.spec.ts`).
  [progress.service.spec.ts](src/app/data/progress.service.spec.ts) is a good example to copy.
- Your saved progress lives in `localStorage`. To reset it, open dev tools → **Application** →
  **Local Storage** and delete the `relic-tracker.progress` key.

## 7. TypeScript you'll see

TypeScript is JavaScript with types. These are the pieces that appear most in this repo:

| Code                                 | Meaning                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------- |
| `interface Relic { id: string; }`    | Describes the shape of an object. Only used for checking; it doesn't exist when the app runs. |
| `vaulted?: boolean`                  | The `?` makes a property optional: it may be missing.                                       |
| `type Rarity = 'common' \| 'rare'`   | A value that must be one of these exact strings.                                            |
| `signal<RelicTier \| 'All'>('All')`  | `<...>` gives the type of value a signal (or Map, input...) holds.                          |
| `(item) => item.name`                | An arrow function: takes `item`, returns `item.name`.                                       |
| `a ?? b`                             | `a`, unless it's `null`/`undefined`, in which case `b`.                                     |
| `a?.b`                               | `a.b`, or `undefined` if `a` is missing (instead of crashing).                              |
| `{ ...s, parts: x }`                 | Spread: a copy of `s` with `parts` replaced.                                                |
| `` `${a} relics` ``                  | Template string: inserts the value of `a` into text.                                        |
| `list.filter(...)`, `.map(...)`, `.some(...)`, `.every(...)` | Keep matching items, transform each item, "is any true?", "are all true?". |
| `new Map<string, PrimeItem>()`       | A lookup table: `.set(key, value)`, `.get(key)`.                                            |

## 8. Troubleshooting

| Symptom                                                         | Likely cause and fix                                                                                     |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `'app-something' is not a known element`                        | The component isn't in the `imports` array of the component whose template uses it. Add and import it.  |
| `Can't bind to 'ngModel' since it isn't a known property`       | Add `FormsModule` to the component's `imports`.                                                          |
| `Could not resolve "./something"`                               | An import path is wrong. Check the folder and file name; paths are relative to the file doing the import. |
| A page shows odd text such as `[Signal: ...]` instead of a value | You used a signal without calling it. Write `search()`, not `search`.                                   |
| You changed progress but nothing updated or saved               | You modified an object inside a signal instead of setting a new one. Use `.set()`/`.update()` with a copy. |
| Saving a file doesn't reload the browser                        | Start the dev server with `--poll 1000` (see [Running it](#2-running-it)).                               |
| Editor says it can't find `@angular/core`                       | You're not in the Dev Container, so the editor can't see `node_modules`. Reopen in container.            |
| "Couldn't load game data" on the page                           | The JSON file is missing or broken. Run `npm run update-data`.                                           |
| Build warns that a component style "exceeded maximum budget"    | A component's `.scss` is over 4 kB (the limit in [angular.json](angular.json)). Move shared styles to `src/styles.scss`. |
| A route never shows its page                                    | It's below the `'**'` route in [app.routes.ts](src/app/app.routes.ts). Move it above.                    |

When an error message mentions a code like `NG8001`, searching for that code on angular.dev
usually finds an explanation.

## 9. Cheat sheet

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

Generating code (run inside the container, from `/app`):

```sh
npx ng generate component path/name --flat    # new component, files directly in path/
npx ng generate service path/name             # new service
npx ng generate component path/name --flat --dry-run   # preview only, writes nothing
```

## 10. Glossary

| Term                    | Meaning                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| Component               | A piece of the screen: a class, a template and styles.                                        |
| Template                | A component's HTML, with Angular syntax for data and events.                                  |
| Selector                | A component's HTML tag name, like `app-item-card`.                                            |
| Signal                  | A watched value; reading it in a template or `computed` keeps that up to date automatically.  |
| Input / output          | How a parent passes data into a child, and how a child sends events back up.                  |
| Service                 | A shared class for logic or state, not tied to one component.                                 |
| Dependency injection    | Angular creating services and handing them to whatever calls `inject()`.                      |
| Provider                | A registration telling Angular how to supply something; see [app.config.ts](src/app/app.config.ts). |
| Route                   | A rule mapping a URL to a page component.                                                     |
| Lazy loading            | Downloading a page's code only when it's first visited.                                       |
| Directive               | Code that adds behaviour to an existing element, like `routerLink` or `ngModel`.              |
| Pipe                    | A display formatter used with `\|` in templates, like `date`.                                 |
| Angular CLI (`ng`)      | The command-line tool that serves, builds, tests and generates code.                          |
| Bootstrap               | Starting the app (`bootstrapApplication` in `main.ts`).                                       |

## 11. Tips and next steps

- Install the **Angular Language Service** extension (the Dev Container includes it). It gives you
  autocomplete and error checking inside the `.html` templates, and `Ctrl+click` on a component tag
  jumps to its class.
- Read the tests ([progress.service.spec.ts](src/app/data/progress.service.spec.ts),
  [app.spec.ts](src/app/app.spec.ts)) to see how the services are used. They're short, and they show
  what each method is supposed to do.
- When you want to change something, find a similar thing the app already does and copy its
  pattern. The two pages are close copies of each other, so comparing them is a good way to see
  which parts are the "Angular way" and which are specific to one page.
- For practice projects, see [Ideas to build yourself](#12-ideas-to-build-yourself) below.
- The official tutorial and guides at https://angular.dev cover each of these concepts in more depth.

## 12. Ideas to build yourself

Practice projects, grouped from easiest to hardest. Each says what you'll learn and where to start.
Try it on your own first; if you get stuck, open the hints one at a time. **Hint 1** points you in
the right direction, and **Hint 2** is closer to a solution.

Before you start each one:

- **Commit your work first.** If the new feature goes wrong, `git diff` shows what you changed and
  `git restore <file>` takes a file back to the last commit.
- **Find the closest thing the app already does** and copy its pattern. Section 6 walks through
  the common cases.
- **Check with `git status`** in the terminal before committing; it's never out of date, unlike
  VS Code's Source Control view can be.

### Warm-ups: reuse patterns you've already used

#### 1. Category filter on the Wishlist

Add the "All categories" dropdown from the Items page to the Wishlist page.

- *You'll learn:* `<select>` with `[(ngModel)]`, and `@for` inside `<option>`.
- *Start:* [items-page.ts](src/app/items/items-page.ts) has `category` and `categories`, and
  [items-page.html](src/app/items/items-page.html) has the `<select>`.

<details>
<summary>Hint 1</summary>

Copy three things from the Items page: the `category` signal, the `categories` computed, and the
`<select>` in the template. The wishlist already imports `FormsModule`, so `[(ngModel)]` works.
Then add a category condition to `filteredItems`, the same one the Items page uses.

</details>

<details>
<summary>Hint 2</summary>

Decide what the dropdown should list. The Items page lists every category. On the wishlist it's
nicer to list only categories you've starred something in, so build it from `wishlistItems()`
instead of `this.data.items()`:

```ts
protected readonly categories = computed(() => [
  ...new Set(this.wishlistItems().map((item) => item.category)),
]);
```

`new Set(...)` removes duplicates, and `[... ]` turns the set back into an array. The extra
condition for `filteredItems` is:

```ts
(this.category() === 'All' || item.category === this.category())
```

</details>

#### 2. Wishlist count in the nav

Show "Wishlist (3)" in the header.

- *You'll learn:* using a service from the root component.
- *Start:* [app.ts](src/app/app.ts) and [app.html](src/app/app.html).

<details>
<summary>Hint 1</summary>

`App` already injects `WarframeDataService`. It also needs `ProgressService`, plus a `computed` that
counts starred items. Then show it in the nav link with `{{ ... }}`. Run `npm test` afterwards:
[app.spec.ts](src/app/app.spec.ts) checks the nav, so see whether it still passes.

</details>

<details>
<summary>Hint 2</summary>

```ts
protected readonly progress = inject(ProgressService);

protected readonly wishlistCount = computed(
  () => this.data.items().filter((item) => this.progress.isFavourite(item.id)).length,
);
```

```html
<a routerLink="/wishlist" routerLinkActive="active">Wishlist ({{ wishlistCount() }})</a>
```

That filter is now written twice, here and in the wishlist page's `wishlistItems`. To tidy up,
move it into `ProgressService` as `readonly favouriteItems = computed(...)` (the service already has
`this.data`), and use `progress.favouriteItems()` in both places.

</details>

#### 3. Progress on each item card

Show "3 / 5" or a small progress bar in each item card's header.

- *You'll learn:* `computed` inside a card, and style bindings like `[style.width.%]`.
- *Start:* [item-card.ts](src/app/items/item-card.ts). It already has `built` and `complete`
  computeds to copy.

<details>
<summary>Hint 1</summary>

You need two numbers: how many parts are done, and how many there are. "How many there are" is
`item().parts.length`. "Done" means a part that isn't needed any more. `progress.isPartNeeded`
already answers that, and for built items it says every part is done.

</details>

<details>
<summary>Hint 2</summary>

```ts
protected readonly partsDone = computed(
  () => this.item().parts.filter((part) => !this.progress.isPartNeeded(this.item(), part)).length,
);
```

For text: `{{ partsDone() }} / {{ item().parts.length }}`. For a bar, two nested `<div>`s, with the
inner width bound to a percentage:

```html
<div class="bar"><div class="fill" [style.width.%]="(partsDone() / item().parts.length) * 100"></div></div>
```

Give `.bar` a height and background, and `.fill` a colour like `var(--success)`, in
[item-card.scss](src/app/items/item-card.scss).

</details>

#### 4. Sorting

Add a "Sort by" dropdown to the Items page: by name, or by closest to complete.

- *You'll learn:* sorting inside a `computed` without changing the original data.
- *Start:* the `filteredItems` computed in [items-page.ts](src/app/items/items-page.ts).

<details>
<summary>Hint 1</summary>

Add a `sort` signal (for example `signal<'name' | 'progress'>('name')`) and a `<select>` for it.
In `filteredItems`, sort the result of `.filter(...)` before returning it.

`.sort()` changes the array it's called on. Never sort `this.data.items()` directly, because every
page shares that array. Sorting the result of `.filter()` is safe, because `filter` returns a new
array. (Newer JavaScript has `.toSorted()`, which copies for you, but this project's TypeScript
settings target ES2022, so it isn't available here.)

</details>

<details>
<summary>Hint 2</summary>

Sorting needs a compare function that returns a negative number if `a` goes first, or positive if
`b` does:

```ts
const items = this.data.items().filter(/* ... */);
if (this.sort() === 'name') return items.sort((a, b) => a.name.localeCompare(b.name));
return items.sort((a, b) => this.fractionDone(b) - this.fractionDone(a)); // most complete first
```

For `fractionDone`, use the same counting as idea #3, divided by `item.parts.length`. If you've
done #3, move that counting into `ProgressService` (for example `partsDone(item)`), so the card
and the page share one version.

</details>

### Medium: one new concept each

#### 5. "Reset progress" button with confirmation

A button that clears all progress, but only after a second "Yes, reset" click.

- *You'll learn:* local UI state with a `signal`, and adding a method to a service.
- *Start:* [progress.service.ts](src/app/data/progress.service.ts). A good place for the button is
  the footer in [app.html](src/app/app.html).

<details>
<summary>Hint 1</summary>

The service needs a `resetProgress()` method that sets `state` back to an empty progress object.
`loadProgress()` already has one called `empty`, but it's inside that function. Move it out so both
can use it.

The confirmation needs one `signal(false)` in the component, which says "are we asking?". Use
`@if` to show either the reset button or the "Are you sure?" buttons.

</details>

<details>
<summary>Hint 2</summary>

In the service:

```ts
function emptyProgress(): Progress {
  return { parts: {}, built: {}, relics: {}, favourites: {} };
}
// in loadProgress(): const empty = emptyProgress();

resetProgress(): void {
  this.state.set(emptyProgress());
}
```

In the template (with `protected readonly confirming = signal(false);` in the class):

```html
@if (confirming()) {
  Reset all progress?
  <button type="button" (click)="progress.resetProgress(); confirming.set(false)">Yes, reset</button>
  <button type="button" (click)="confirming.set(false)">Cancel</button>
} @else {
  <button type="button" (click)="confirming.set(true)">Reset progress</button>
}
```

You don't need to save anything yourself: the service's `effect` saves the new empty state.

</details>

#### 6. Remember filters in the URL

Make `/items?q=ash` open with "ash" already in the search box, and keep the URL updated as you type,
so you can bookmark or share a filtered view.

- *You'll learn:* query parameters, `input()` with `withComponentInputBinding()`, `linkedSignal`, and
  navigating from code with `Router`.
- *Start:* [relics-page.ts](src/app/relics/relics-page.ts) already reads `?q=` into its search box.

<details>
<summary>Hint 1</summary>

There are two halves. **Reading** the URL: copy the relics page's `q = input<string>()` and turn
`search` into a `linkedSignal` that starts from it. **Writing** the URL: whenever `search` changes,
tell the router to update the query parameters. An `effect` is a good fit for "whenever this
changes, do that".

</details>

<details>
<summary>Hint 2</summary>

```ts
readonly q = input<string>();
protected readonly search = linkedSignal(() => this.q() ?? '');

private readonly router = inject(Router);
private readonly route = inject(ActivatedRoute);

constructor() {
  effect(() => {
    const q = this.search().trim();
    this.router.navigate([], {
      relativeTo: this.route,         // stay on this page; without it, [] means the home page
      queryParams: { q: q || null },  // null removes the parameter
      queryParamsHandling: 'merge',   // keep any other parameters
      replaceUrl: true,               // don't add a browser history entry per keystroke
    });
  });
}
```

`Router` and `ActivatedRoute` come from `@angular/router`. URL values are always text, so for a
checkbox like `hideComplete`, use `input(false, { transform: booleanAttribute })`, which turns
`"true"` and `"false"` back into booleans. `booleanAttribute` comes from `@angular/core`.

</details>

#### 7. Item detail page at `/items/:id`

Click an item's name to open a page with just that item.

- *You'll learn:* route parameters, `routerLink` with arrays, and handling "not found".
- *Start:* [app.routes.ts](src/app/app.routes.ts), and "Adding a new page" in section 6.

<details>
<summary>Hint 1</summary>

Add a route with `path: 'items/:id'`. The `:id` part is a parameter, and thanks to
`withComponentInputBinding()`, an `id = input<string>()` on the page receives it. Then look the item
up with a `computed`, and use `@if` to show either the item or a "not found" message.

</details>

<details>
<summary>Hint 2</summary>

```ts
readonly id = input<string>();
protected readonly item = computed(() => this.data.items().find((item) => item.id === this.id()));
```

On the detail page you can reuse the card: `<app-item-card [item]="item" />` inside
`@if (item(); as item) { ... }`. (`as item` saves the result, so you don't call `item()` twice.)

Item ids look like `/Lotus/Types/...` and contain slashes. To link to one, use the array form
`[routerLink]="['/items', item().id]"` in [item-card.html](src/app/items/item-card.html). The array
form escapes the slashes for you (they become `%2F`). After clicking a link, also try reloading the
browser on that URL to check it still works.

</details>

#### 8. Write tests for your new code

Cover `isFavourite`/`setFavourite` and `canFarm` in
[progress.service.spec.ts](src/app/data/progress.service.spec.ts).

- *You'll learn:* unit testing with `TestBed`, and making fake test data.
- *Start:* the existing tests in that file. Do the favourites ones first; `canFarm` is harder.

<details>
<summary>Hint 1</summary>

The favourites tests are copies of the existing tests with the names changed: set a favourite,
check `isFavourite`, and check it's saved (the "saves to localStorage" test shows how, including
`TestBed.tick()` to run the saving effect).

`canFarm` is harder because it needs game data: which relics drop which parts.
[app.spec.ts](src/app/app.spec.ts) shows how to answer the data request with fake data, using
`HttpTestingController`.

</details>

<details>
<summary>Hint 2</summary>

For `canFarm`, give the data service a tiny fake data set, with one unvaulted relic that drops
Ash's blade:

```ts
const relic: Relic = {
  id: 'Lith A1', tier: 'Lith', code: 'A1', vaulted: false,
  rewards: [{ name: 'Ash Prime Blade', rarity: 'common', partId: 'ash-blade' }],
};

TestBed.inject(WarframeDataService);
TestBed.tick(); // lets httpResource send its request
TestBed.inject(HttpTestingController)
  .expectOne('data/warframe-data.json')
  .flush({ generatedAt: '', relics: [relic], items: [ashPrime] });

expect(progress.canFarm(ashPrime)).toBe(true);
```

Then write the opposite cases: own both blades and it should be `false`; make the relic
`vaulted: true` and it should be `false`. A test for each rule is how you know a later change
didn't break it.

</details>

### Bigger: several concepts together

#### 9. Relic refinement odds

Show each reward's drop chance on relic cards, with a selector for Intact, Exceptional, Flawless
and Radiant.

- *You'll learn:* combining a page-level setting with card display, passing an extra `input()` to a
  card, and pipes for number formatting.
- *Start:* [relics-page.ts](src/app/relics/relics-page.ts) for the selector, and
  [relic-card.ts](src/app/relics/relic-card.ts) for the display.

Every relic has 3 commons, 2 uncommons and 1 rare. These are the chances for each reward:

| Refinement  | Each common | Each uncommon | Rare |
| ----------- | ----------- | ------------- | ---- |
| Intact      | 25.33%      | 11%           | 2%   |
| Exceptional | 23.33%      | 13%           | 4%   |
| Flawless    | 20%         | 17%           | 6%   |
| Radiant     | 16.67%      | 20%           | 10%  |

This is a fixed table in code; the data file doesn't need to change.

<details>
<summary>Hint 1</summary>

Three pieces: put the table in code as a constant (for example in [models.ts](src/app/data/models.ts)),
add a `refinement` signal and `<select>` to the relics page, and pass the choice to each card with
`[refinement]="refinement()"`. The card declares `refinement = input<Refinement>('Intact')` and
looks up each reward's chance.

</details>

<details>
<summary>Hint 2</summary>

```ts
export type Refinement = 'Intact' | 'Exceptional' | 'Flawless' | 'Radiant';

export const REWARD_CHANCE: Record<Refinement, Record<Rarity, number>> = {
  Intact: { common: 25.33, uncommon: 11, rare: 2 },
  Exceptional: { common: 23.33, uncommon: 13, rare: 4 },
  Flawless: { common: 20, uncommon: 17, rare: 6 },
  Radiant: { common: 16.67, uncommon: 20, rare: 10 },
};
```

A template can only use the component's own properties, not constants imported at the top of the
file. Expose it on the card with `protected readonly chances = REWARD_CHANCE;`, then:

```html
{{ chances[refinement()][reward.rarity] | number: '1.0-2' }}%
```

The `number` pipe comes from `DecimalPipe` in `@angular/common`, which goes in the card's `imports`.
`'1.0-2'` means "at most 2 decimal places".

</details>

#### 10. "Best relics to open"

On the Relics page, sort or highlight the relics you own by how likely they are to give you a part
you need.

- *You'll learn:* building a ranking with `computed`, and combining both services.
- *Start:* `progress.isRewardNeeded` and `progress.relicCount` give you everything you need. Do #9
  first if you want to use the odds.

<details>
<summary>Hint 1</summary>

Start simple: for each relic, count how many of its rewards you still need. Add a "Sort by: most
needed" option to the relics page (the sorting pattern from #4), or show the count on each card.
Then improve it with the odds from #9.

</details>

<details>
<summary>Hint 2</summary>

Counting needed rewards:

```ts
relic.rewards.filter((reward) => this.progress.isRewardNeeded(reward.partId)).length
```

With odds, add up the chances of the needed rewards instead of counting them. The total is the
chance that opening this relic gives you something you need:

```ts
relic.rewards
  .filter((reward) => this.progress.isRewardNeeded(reward.partId))
  .reduce((total, reward) => total + REWARD_CHANCE[this.refinement()][reward.rarity], 0)
```

`.reduce` combines a list into one value; here it adds up, starting from `0`. Showing "38% chance
of a needed part" on each card is a nice result.

</details>

#### 11. Import and export progress

Download your progress as a JSON file, and load it back in another browser.

- *You'll learn:* browser file APIs (`Blob`, `<input type="file">`) from Angular, and checking data
  you don't control.
- *Start:* [progress.service.ts](src/app/data/progress.service.ts). `state` is private, so the
  service needs methods to turn progress into text and back.

<details>
<summary>Hint 1</summary>

Add two service methods: `exportJson()` returns `JSON.stringify(this.state())`, and
`importJson(text)` parses text and replaces the state. The component downloads the text as a file,
and reads a chosen file back with `file.text()`.

Check that an imported file looks like progress before replacing anything. A wrong or broken file
should show an error, not wipe someone's data.

</details>

<details>
<summary>Hint 2</summary>

Downloading, in the component:

```ts
protected download(): void {
  const blob = new Blob([this.progress.exportJson()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'relic-tracker-progress.json';
  link.click();
  URL.revokeObjectURL(url);
}
```

Uploading, with `<input type="file" accept=".json" (change)="upload($event)" />` in the template:

```ts
protected async upload(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try {
    this.progress.importJson(await file.text());
  } catch {
    this.importError.set('That file is not Relic Tracker progress.');
  }
}
```

In `importJson`, `JSON.parse` throws on broken text. After parsing, check the result is an object
whose `parts`, `built` and `relics` are objects, and `throw new Error(...)` if not. Merge it over
an empty progress object, like `loadProgress()` does, so older files without `favourites` still work.

</details>

#### 12. Ducat values

Show what each part sells for, and a total per item.

- *You'll learn:* the full path from data to screen: the Node script, the JSON file, `models.ts`,
  and the templates.
- *Start:* [scripts/update-data.mjs](scripts/update-data.mjs). The generated JSON doesn't contain
  ducat values yet, so this begins in the script. Running `npm run update-data` needs internet
  access.

<details>
<summary>Hint 1</summary>

The Public Export has a `primeSellingPrice` field, but before you write any code, find out *which*
export entries carry it: the recipes (`ExportRecipes`), the components (`ExportResources`), or both.
Temporarily `console.log` one matching entry from each and run the script. Then look at
`resolvePart()` and the line that creates each part,
`item.parts.set(partId, { id: partId, name: partName, count })`, and add a `ducats` value there.

</details>

<details>
<summary>Hint 2</summary>

To find the field:

```js
console.log(resources.ExportResources.find((r) => r.primeSellingPrice));
console.log(recipes.ExportRecipes.find((r) => r.primeSellingPrice));
```

Then build a lookup next to `names`, for example
`new Map(list.filter((x) => x.primeSellingPrice).map((x) => [x.uniqueName, x.primeSellingPrice]))`.
A reward's `partId` is sometimes the blueprint and sometimes the component (see the comment at the
top of the script), so you may need to check both ids.

Then add `ducats?: number` to `ItemPart` in [models.ts](src/app/data/models.ts) (the `?` because
old data won't have it), and show it in [item-card.html](src/app/items/item-card.html). The total
per item is a `computed` that adds up `part.ducats ?? 0`. Commit the regenerated JSON file too.

</details>

### Code-quality projects

#### 13. A shared filter toolbar component

The Items and Wishlist pages repeat the same search box and "Only farmable now" checkbox. Move them
into one reusable component.

- *You'll learn:* designing a component with two-way `model()` inputs, as
  [counter.ts](src/app/shared/counter.ts) does for a single number, and content projection.
- *Start:* decide what the new component owns (the inputs and checkboxes) and what each page keeps
  (its signals and its filtered list).

<details>
<summary>Hint 1</summary>

Generate a component, for example `npx ng generate component shared/item-filters --flat`. Give it
`search = model('')` and `onlyFarmable = model(false)`, move the toolbar HTML into its template,
and use it on each page with `[(search)]="search"` and `[(onlyFarmable)]="onlyFarmable"`. Each page
keeps its own signals and its `filteredItems`.

</details>

<details>
<summary>Hint 2</summary>

Inside the new component, `[(ngModel)]="search"` works on a `model()` signal just as it does on a
normal `signal()`. It needs `FormsModule` in its `imports`.

Each page has a different summary ("12 / 340 complete", "2 / 5 items"). Rather than adding an input
for it, put `<ng-content />` at the end of the toolbar template. Whatever a page writes between the
tags is placed there:

```html
<app-item-filters [(search)]="search" [(onlyFarmable)]="onlyFarmable">
  <span class="summary">{{ completeCount() }} / {{ totalCount() }} complete</span>
</app-item-filters>
```

The two pages' filter conditions are also duplicated. Moving "does this item match the search and
farmable filters?" into one function, for example in `ProgressService`, removes that too.

</details>

#### 14. Signal-based forms

The toolbars use `ngModel` from `FormsModule`. Newer Angular versions have signal-based forms,
designed to work with signals directly.

- *You'll learn:* the newest forms API.
- *Start:* do this one last. Search angular.dev for "Signal Forms", and check that the docs match
  the Angular version in [package.json](package.json).

<details>
<summary>Hint 1</summary>

Start with the smallest toolbar, then copy the approach to the others. With signal forms you
usually keep all of a form's values in one signal holding an object, such as
`{ search: '', onlyFarmable: false }`, instead of one signal per field.

</details>

<details>
<summary>Hint 2</summary>

Once the values live in one object signal, `filteredItems` reads `this.filters().search` and so on.
Compare the before and after: the template bindings change, but the filtering logic barely does.
That shows how well the filtering is separated from the form.

</details>
