import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './cart.reducers.js';

export function createCartSelectors<T>(
  name: string,
  getId: (item: T) => string | number
) {
  const selectCartState = createFeatureSelector<State<T>>(name);

  const selectItems = createSelector(
    selectCartState,
    (state) => state.items,
  );

  const selectItemIds = createSelector(
    selectItems,
    (items) => items.map(getId),
  );

  const selectCount = createSelector(
    selectItems,
    (items) => items.length,
  );
  return {
    selectCartState,
    selectItems,
    selectItemIds,
    selectCount,
  };
}