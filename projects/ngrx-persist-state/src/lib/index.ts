import { ActionReducer, Action } from '@ngrx/store';

export type NestedKey<T> = {
  [k in keyof T]?:
    | boolean
    | {
        serialize?: (value: any) => string;
        deserialize?: (value: string) => any;
      }
    | NestedKey<T[k]>
};

export function createPersistStateReducer<T>({
  defaultSerialize = JSON.stringify,
  defaultDeserialize = JSON.parse,
  globalKey = '__STATE__',
  storage = localStorage,
  keys = null,
}: {
  defaultSerialize?: (value: any) => string;
  defaultDeserialize?: (value: string) => any;
  globalKey?: string;
  storage?: Storage;
  keys?: NestedKey<T>;
} = {}) {
  return function(next: ActionReducer<T>) {
    const keyEntries: [string, any][] = keys ? Object.entries(keys) : [];
    const storeWholeState = keyEntries.length === 0;

    const persistedState = wrapTryCatch(() => {
      const persisted = storeWholeState
        ? getState(globalKey, storage, defaultDeserialize)
        : composeStateFromKeys(keyEntries, storage, defaultDeserialize);
      return isNotEmpty(persisted) ? persisted : undefined;
    }, undefined);

    return function(state: T = persistedState, action: Action) {
      const nextState = next(state, action);
      wrapTryCatch(() => {
        if (storeWholeState) {
          storage.setItem(globalKey, defaultSerialize(nextState));
        } else {
          const slices = getSlices(nextState, keyEntries, storage, defaultSerialize);
          slices.forEach(([key, slice]) => storage.setItem(key, slice));
        }
      });
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

function getState(key: string, storage: Storage, deserialize: (value: string) => any) {
  const state = storage.getItem(key);
  return state ? deserialize(state) : undefined;
}

function composeStateFromKeys(entries: [string, any][], storage: Storage, deserialize: (value: string) => any, path: string = '') {
  return entries.reduce((acc, [key, value]) => {
    const slicePath = path ? `${path}.${key}` : key;

    if (value === true || value.deserialize) {
      const slice = getState(slicePath, storage, value.deserialize || deserialize);
      if (slice) {
        acc[key] = slice;
      }
    } else if (typeof value === 'object') {
      const slice = composeStateFromKeys(Object.entries(value), storage, deserialize, slicePath);
      if (isNotEmpty(slice)) {
        acc[key] = slice;
      }
    }

    return acc;
  }, {});
}

function getSlices(state: any, entries: [string, any][], storage: Storage, serialize: (value: any) => string, path: string = '') {
  return entries.reduce((acc, [key, value]) => {
    const slice = state[key];
    const slicePath = path ? `${path}.${key}` : key;
    if (value === true || value.serialize) {
      acc.push([slicePath, (value.serialize || serialize)(slice)]);
    } else if (typeof value === 'object') {
      acc.push(...getSlices(slice, Object.entries(value), storage, serialize, slicePath));
    }
    return acc;
  }, []);
}

const isNotEmpty = obj => obj && Object.keys(obj).length > 0;
