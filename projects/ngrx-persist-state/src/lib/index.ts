import { ActionReducer, Action } from '@ngrx/store';

export type NestedKey<T> = {
  [k in keyof T]?:
    | boolean
    | {
        serialize?: (...args: any[]) => any;
        deserialize?: (...args: any[]) => string;
      }
    | NestedKey<T[k]>
};

export function createPersistStateReducer<T>({
  defaultSerialize = JSON.stringify,
  defaultDeserialize = JSON.parse,
  globalKey = '__STATE__',
  storage = localStorage,
  keys = {},
}: {
  defaultSerialize?: (...args: any[]) => string;
  defaultDeserialize?: (...args: any[]) => any;
  globalKey?: string;
  storage?: Storage;
  keys?: NestedKey<T>;
} = {}) {
  return function(next: ActionReducer<T>) {
    const persistedState = wrapTryCatch(() => {
      const persisted = storage.getItem(globalKey);
      return persisted ? defaultDeserialize(persisted) : undefined;
    }, undefined);

    return function(state: T = persistedState, action: Action) {
      const nextState = next(state, action);
      wrapTryCatch(() => storage.setItem(globalKey, defaultSerialize(nextState)));
      return nextState;
    };
  };
}

function wrapTryCatch(fun: () => any, fallback: any | void = () => {}) {
  try {
    return fun();
  } catch (error) {
    console.error(error);
    return fallback;
  }
}
