# @thydda/cart-state

**Current package version: 0.1.0**

Generic cart state utilities for Angular applications using NgRx Store. The package
exports factories for actions, reducers and selectors. It has no components,
server, HTTP client or dependency on a movie/product model.

## Functionality

- Initialize a cart with an empty `items` array.
- Add items without duplicating their IDs. Adding an existing ID preserves the
  original item; it does not replace it.
- Remove items by ID without mutating the previous state.
- Derive the items, their IDs and the item count through memoized selectors.
- Create independent carts with different action namespaces and feature keys.

State lives in memory in the consuming application's NgRx Store. Reloading the
application resets it. Persistence, quantities, totals and backend synchronization
are not implemented. Items are retained by reference; consumers must treat them
as immutable.

## Structure

```text
src/
  cart.actions.ts
  cart.reducers.ts
  cart.selectors.ts
  index.ts
tests/
  cart-state.test.mjs
dist/                  # Generated JavaScript and declarations
```

## Dependencies and requirements

Use a Node.js version compatible with Angular 22 and TypeScript 6. The test suite
has been verified with Node.js 24.21.0. npm installs dependencies using the committed
`package-lock.json`.

| Dependency | Declared version | Purpose |
| --- | --- | --- |
| `@angular/core` | `^22.1.0` | Angular runtime peer |
| `@ngrx/store` | `^22.0.1` | Actions, reducers and selectors |
| `rxjs` | `^7.8.0` | NgRx runtime peer |
| `typescript` | `~6.0.2` | Development: compilation and declarations |
| `@angular/compiler` | `22.2.3` | Development: load partially compiled Angular/NgRx code in Node tests |

The runtime peers are also development dependencies so the package can compile
and run its own tests. `@angular/compiler` is loaded by tests, not exported by the
library. No browser extension is required to use or test the package.

## Public API and types

Import from `@thydda/cart-state`, rather than internal source files.

```ts
interface State<T> {
  readonly items: readonly T[];
}
```

`T` is the application's item model. It does not need an `id` property: the
application supplies `getId: (item: T) => string | number`.

| Export | Inputs | Result |
| --- | --- | --- |
| `createCartActions<T>` | Action namespace `name: string` | `itemAdded` and `itemRemoved` action creators |
| `createCartReducer<T>` | Actions from the factory and `getId` | Reducer with initial state `{ items: [] }` |
| `createCartSelectors<T>` | Registered feature key and `getId` | `selectCartState`, `selectItems`, `selectItemIds`, `selectCount` |
| `State<T>` | Item type | Type of the cart feature state |

Action payloads:

```ts
itemAdded({ item });     // { item: T }
itemRemoved({ itemId }); // { itemId: number }
```

Action types are `[<name>] Item added` and `[<name>] Item removed`. Use a unique
namespace for each independent cart. Reuse the same action creators when creating
the reducer and dispatching actions.

### Current ID limitation

Although `getId` accepts string or numeric IDs, `itemRemoved` currently accepts
only `number`. String IDs work for adding items, deduplication and selectors,
but string-ID removal is not supported by the public TypeScript contract.

`selectItemIds` returns `(string | number)[]`, even if the supplied model uses only
numeric IDs. Consumers needing `number[]` must narrow the values or evolve the
factory API to preserve the ID type. Do not hide this difference with an unchecked
cast.

## Define a cart in an application

Create this configuration once and reuse its exports across the application:

```ts
import {
  createCartActions,
  createCartReducer,
  createCartSelectors,
} from '@thydda/cart-state';

export interface Product {
  readonly id: number;
  readonly title: string;
}

export const cartFeatureKey = 'cart';
const getId = (product: Product) => product.id;

export const cartActions = createCartActions<Product>('Products cart');
export const cartReducer = createCartReducer<Product>(cartActions, getId);
export const cartSelectors = createCartSelectors<Product>(cartFeatureKey, getId);
```

The action namespace (`Products cart`) identifies events. The feature key (`cart`)
identifies the state section and must match the selector's feature key.

## Register at application startup

In the consuming application's `app.config.ts`, add these providers alongside
its router and other existing providers:

```ts
import { ApplicationConfig } from '@angular/core';
import { provideState, provideStore } from '@ngrx/store';
import { cartFeatureKey, cartReducer } from './cart.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideStore(),
    provideState({ name: cartFeatureKey, reducer: cartReducer }),
  ],
};
```

If `provideStore()` already exists, keep that registration and add only
`provideState(...)`. Register each feature key once per application Store.
The resulting root state includes `{ cart: { items: [] } }`.

The feature must be registered before its selectors are consumed. An
`undefined` feature state usually indicates a missing registration or a different
feature key; the reducer's initial state cannot initialize an unregistered feature.

## Dispatch actions and read state

Inside an Angular component:

```ts
private readonly store = inject(Store);

readonly items = this.store.selectSignal(cartSelectors.selectItems);
readonly count = this.store.selectSignal(cartSelectors.selectCount);
readonly itemIds = this.store.selectSignal(cartSelectors.selectItemIds);

add(product: Product): void {
  this.store.dispatch(cartActions.itemAdded({ item: product }));
}

remove(productId: number): void {
  this.store.dispatch(cartActions.itemRemoved({ itemId: productId }));
}
```

Import `inject` from `@angular/core`, `Store` from `@ngrx/store`, and the cart
configuration exports and `Product` from your application's configuration module.
The reducer updates `items`; all consuming views read the same state through
selectors. IDs and count are derived rather than stored separately.

For a movie component requiring `number[]`, narrow the IDs explicitly:

```ts
readonly selectedMovieIds = computed(() =>
  this.itemIds().filter((id): id is number => typeof id === 'number'),
);
```

Import `computed` from `@angular/core`. The movie model and the Web Component
remain concerns of the consuming application.

## Native Federation integration

Keep the common cart configuration accessible to both shell and remote. Installing
this generic package alone does not give independently created carts the same
feature key, action namespace or item model.

- The shell registers the root Store and cart feature when it boots.
- The remote's standalone startup registers its own root Store and cart feature.
- When hosted, the remote uses the shell's registration; its standalone
  `app.config.ts` does not execute.
- Share compatible `@ngrx/store` and Angular runtime packages as singletons in
  federation configuration so providers and consumers use matching DI tokens.
- Do not also register the same cart feature in the remote routes if the host
  already registers it at startup.

A standalone remote and a shell opened in separate tabs have separate state.
Federation does not synchronize browser tabs or persist the cart.

## Scripts, compilation and tests

From this package directory:

```sh
npm ci
npm run build
npm test
npm run check
```

| Script | Behavior |
| --- | --- |
| `build` | Run TypeScript and emit ESM JavaScript and `.d.ts` declarations to `dist/` |
| `test` | Build first, then run `node --test tests/*.test.mjs` |
| `check` | Run `npm test`, including compilation |
| `prepack` | Run the build before packaging, including publication |
| `prepublishOnly` | Run compilation and tests before publication |

Tests import the public package API and cover action payloads/namespaces, reducer
initialization, unknown actions, deduplication, immutable updates, removal,
independent carts, empty selectors, custom feature keys, memoization and a second
model using string IDs for additions and selection. There are currently 11 tests.
They do not exercise browser rendering or federation between running applications.

TypeScript uses strict checking, `NodeNext` modules and ES2022 output. Relative
imports in `src/` use `.js` extensions, which TypeScript resolves to their `.ts`
source files. The package exposes only the public barrel through `exports`.

## Versioning

Keep `package.json` and `package-lock.json` versions synchronized. Use
[Semantic Versioning](https://semver.org/): compatible fixes increment PATCH,
compatible additions increment MINOR, and incompatible stable API changes
increment MAJOR. During the current `0.x` development phase, treat the API as
unstable and explicitly document compatibility changes in release notes.

For example, to advance `0.1.0` to `0.1.1` without creating a Git commit or tag:

```sh
npm version patch --no-git-tag-version
npm run check
```

Use `minor` for the next feature release, or an explicit version when agreed.
Review and commit version and release-note changes before publishing. Never reuse
a published version. Pin the intended release in consumers and update their
lockfiles together.

See [npm version](https://docs.npmjs.com/cli/v11/commands/npm-version/).

## Publishing to GitHub Packages

The package is configured to publish `@thydda/cart-state` to
`https://npm.pkg.github.com`, linked to `https://github.com/thydda/cart-state`.
Create that repository if it does not exist and push the reviewed package source
there before the first release. GitHub Packages hosts the npm package; the GitHub
repository hosts its source code. Confirm access to the `thydda` namespace.

Authenticate with a GitHub personal access token (classic) with `write:packages`
and `read:packages`, and appropriate access to the destination:

```sh
npm login --scope=@thydda --registry=https://npm.pkg.github.com --auth-type=legacy
```

Use your GitHub username and the token as the password. Keep credentials out of
versioned files. Check existing versions before choosing a release version:

```sh
npm view @thydda/cart-state versions --json --registry=https://npm.pkg.github.com
```

A failed lookup can mean missing access or a network issue; do not assume that the
package is unpublished without checking the error.

Validate and inspect the package before publishing:

```sh
npm run check
npm pack --dry-run
npm publish --registry=https://npm.pkg.github.com
```

Verify that the archive contains `dist/index.js`, `dist/index.d.ts` and their
referenced modules. `files: ["dist"]` selects compiled output; npm also includes
standard package metadata and the README.

The `prepack` hook builds the package, and `prepublishOnly` runs `npm run check`
before publication. A failed build or test prevents the publication command from
completing.

After publishing, verify the chosen release:

```sh
npm view @thydda/cart-state@0.1.0 version --registry=https://npm.pkg.github.com
```

See [GitHub Packages npm registry documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry).

## Install a published version

In the consumer's project `.npmrc`, configure the scope without embedding a token:

```ini
@thydda:registry=https://npm.pkg.github.com
```

Authenticate with package read access and install the intended release:

```sh
npm login --scope=@thydda --registry=https://npm.pkg.github.com --auth-type=legacy
npm install @thydda/cart-state@0.1.0 --save-exact
```

Run the installation in both `shell` and `mfe1`. Replace `0.1.0` with an available
published version. The applications download the package from GitHub Packages;
they do not need a sibling `cart-state` folder or a local archive. Rebuild and
verify both the standalone remote and its integration through the shell after
updating.
