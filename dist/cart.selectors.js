import { createFeatureSelector, createSelector } from '@ngrx/store';
export function createCartSelectors(name, getId) {
    const selectCartState = createFeatureSelector(name);
    const selectItems = createSelector(selectCartState, (state) => state.items);
    const selectItemIds = createSelector(selectItems, (items) => items.map(getId));
    const selectCount = createSelector(selectItems, (items) => items.length);
    return {
        selectCartState,
        selectItems,
        selectItemIds,
        selectCount,
    };
}
