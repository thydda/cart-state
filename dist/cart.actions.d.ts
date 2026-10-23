export declare function createCartActions<T>(name: string): {
    itemAdded: import("@ngrx/store").ActionCreator<`[${string}] Item added`, (props: {
        item: T;
    }) => {
        item: T;
    } & import("@ngrx/store").Action<`[${string}] Item added`>>;
    itemRemoved: import("@ngrx/store").ActionCreator<`[${string}] Item removed`, (props: {
        itemId: number;
    }) => {
        itemId: number;
    } & import("@ngrx/store").Action<`[${string}] Item removed`>>;
};
