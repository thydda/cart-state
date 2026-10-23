import { createReducer, on } from '@ngrx/store';
import { createCartActions } from './cart.actions.js';

export interface State<T> {
  readonly items: readonly T[];
}

export function createCartReducer<T>(
  actions: ReturnType<typeof createCartActions<T>>,
  getId:(item: T) => string | number
){
  const initialState: State<T> = {
    items: [],
  };
  return createReducer(
    initialState,
    on(actions.itemAdded, (state, { item }) => ({
      ...state,
      items: state.items.some((i) => getId(i) === getId(item))
        ? state.items
        : [...state.items, item],
    })),
    on(actions.itemRemoved, (state, { itemId }) => ({
      ...state,
      items: state.items.filter((item) => getId(item) !== itemId),
    })),
  );
}