import { createReducer, on } from '@ngrx/store';
export function createCartReducer(actions, getId) {
    const initialState = {
        items: [],
    };
    return createReducer(initialState, on(actions.itemAdded, (state, { item }) => ({
        ...state,
        items: state.items.some((i) => getId(i) === getId(item))
            ? state.items
            : [...state.items, item],
    })), on(actions.itemRemoved, (state, { itemId }) => ({
        ...state,
        items: state.items.filter((item) => getId(item) !== itemId),
    })));
}
