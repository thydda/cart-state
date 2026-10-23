import { State } from './cart.reducers.js';
export declare function createCartSelectors<T>(name: string, getId: (item: T) => string | number): {
    selectCartState: import("@ngrx/store").MemoizedSelector<object, State<T>, import("@ngrx/store").DefaultProjectorFn<State<T>>>;
    selectItems: import("@ngrx/store").MemoizedSelector<object, readonly T[], (s1: State<T>) => readonly T[]>;
    selectItemIds: import("@ngrx/store").MemoizedSelector<object, (string | number)[], (s1: readonly T[]) => (string | number)[]>;
    selectCount: import("@ngrx/store").MemoizedSelector<object, number, (s1: readonly T[]) => number>;
};
