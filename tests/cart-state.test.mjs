import '@angular/compiler';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createCartActions,
  createCartReducer,
  createCartSelectors,
} from '@thydda/cart-state';

const first = Object.freeze({ key: 1, title: 'Arrival' });
const second = Object.freeze({ key: 2, title: 'Moonlight' });
const getId = (item) => item.key;

function setup(name = 'cart') {
  const actions = createCartActions(name);
  return {
    actions,
    reducer: createCartReducer(actions, getId),
    selectors: createCartSelectors(name, getId),
  };
}

const frozenState = (...items) => Object.freeze({ items: Object.freeze(items) });

describe('cart actions', () => {
  it('includes the namespace and the add/remove payloads', () => {
    const { actions } = setup('Library');
    assert.deepEqual(actions.itemAdded({ item: first }), {
      type: '[Library] Item added', item: first,
    });
    assert.deepEqual(actions.itemRemoved({ itemId: 1 }), {
      type: '[Library] Item removed', itemId: 1,
    });
  });
});

describe('cart reducer', () => {
  it('initializes an empty cart and ignores unknown actions', () => {
    const { reducer } = setup();
    assert.deepEqual(reducer(undefined, { type: 'init' }), { items: [] });
    const state = frozenState(first);
    assert.equal(reducer(state, { type: 'unrelated' }), state);
  });

  it('adds items using a custom ID property without mutating the previous state', () => {
    const { reducer, actions } = setup();
    const previous = frozenState(first);
    const next = reducer(previous, actions.itemAdded({ item: second }));
    assert.deepEqual(next.items, [first, second]);
    assert.deepEqual(previous.items, [first]);
    assert.notEqual(next, previous);
    assert.notEqual(next.items, previous.items);
  });

  it('does not duplicate or overwrite an item with the same ID', () => {
    const { reducer, actions } = setup();
    const previous = frozenState(first);
    const next = reducer(previous, actions.itemAdded({ item: { key: 1, title: 'Changed' } }));
    assert.deepEqual(next.items, [first]);
    assert.equal(next.items[0], first);
  });

  it('removes only the requested item without mutating the previous state', () => {
    const { reducer, actions } = setup();
    const previous = frozenState(first, second);
    const next = reducer(previous, actions.itemRemoved({ itemId: 1 }));
    assert.deepEqual(next.items, [second]);
    assert.deepEqual(previous.items, [first, second]);
  });

  it('preserves the contents when removing an unknown ID or from an empty cart', () => {
    const { reducer, actions } = setup();
    assert.deepEqual(reducer(frozenState(first), actions.itemRemoved({ itemId: 999 })).items, [first]);
    assert.deepEqual(reducer(frozenState(), actions.itemRemoved({ itemId: 1 })).items, []);
  });

  it('keeps separately named carts independent', () => {
    const cart = setup('cart');
    const favorites = setup('favorites');
    const state = frozenState(first);
    assert.equal(favorites.reducer(state, cart.actions.itemAdded({ item: second })), state);
    assert.equal(favorites.reducer(state, cart.actions.itemRemoved({ itemId: 1 })), state);
  });
});

describe('cart selectors', () => {
  it('reads the registered feature, its items, IDs and count', () => {
    const { selectors } = setup('checkout');
    const state = { checkout: frozenState(first, second), unrelated: { items: [] } };
    assert.equal(selectors.selectCartState(state), state.checkout);
    assert.equal(selectors.selectItems(state), state.checkout.items);
    assert.deepEqual(selectors.selectItemIds(state), [1, 2]);
    assert.equal(selectors.selectCount(state), 2);
  });

  it('returns empty results for an initialized empty cart', () => {
    const { selectors } = setup();
    const state = { cart: frozenState() };
    assert.deepEqual(selectors.selectItems(state), []);
    assert.deepEqual(selectors.selectItemIds(state), []);
    assert.equal(selectors.selectCount(state), 0);
  });

  it('memoizes derived IDs across unrelated state updates and recalculates after cart changes', () => {
    const { selectors, actions, reducer } = setup();
    const cart = frozenState(first);
    const ids = selectors.selectItemIds({ cart, other: 1 });
    assert.equal(selectors.selectItemIds({ cart, other: 2 }), ids);
    const updated = { cart: reducer(cart, actions.itemAdded({ item: second })) };
    assert.deepEqual(selectors.selectItemIds(updated), [1, 2]);
    assert.notEqual(selectors.selectItemIds(updated), ids);
    assert.equal(selectors.selectCount(updated), 2);
  });

  it('supports a different model with string IDs for additions and selection', () => {
    const actions = createCartActions('products');
    const getSku = (product) => product.sku;
    const reducer = createCartReducer(actions, getSku);
    const selectors = createCartSelectors('products', getSku);
    const product = { sku: 'BOOK-1', price: 12 };
    const state = { products: reducer(undefined, actions.itemAdded({ item: product })) };
    assert.deepEqual(selectors.selectItems(state), [product]);
    assert.deepEqual(selectors.selectItemIds(state), ['BOOK-1']);
    assert.equal(selectors.selectCount(state), 1);
  });
});
