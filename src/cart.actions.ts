import { createAction, props } from "@ngrx/store";

export function createCartActions<T>(
    name: string,
){
    return {
        itemAdded: createAction(
    `[${name}] Item added`,
    props<{ item: T }>()
),
        itemRemoved: createAction(
            `[${name}] Item removed`,
            props<{ itemId: number }>()
        )
    }
}

