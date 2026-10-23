import { createCartActions } from './cart.actions.js';
export interface State<T> {
    readonly items: readonly T[];
}
export declare function createCartReducer<T>(actions: ReturnType<typeof createCartActions<T>>, getId: (item: T) => string | number): import("@ngrx/store").ActionReducer<State<T>, import("@ngrx/store").Action<string>>;
