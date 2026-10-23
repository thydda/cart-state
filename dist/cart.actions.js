import { createAction, props } from "@ngrx/store";
export function createCartActions(name) {
    return {
        itemAdded: createAction(`[${name}] Item added`, props()),
        itemRemoved: createAction(`[${name}] Item removed`, props())
    };
}
