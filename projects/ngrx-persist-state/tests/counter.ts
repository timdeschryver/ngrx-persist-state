import { Action, StoreModule, Store } from '@ngrx/store';
import { setup, teardown, MockStorage } from './utils';

import { createPersistStateReducer } from '../src/public_api';

interface State {
  counter: number;
}

function reducer(state: number = 0, action: Action) {
  switch (action.type) {
    case 'INCREMENT':
      return state + 1;

    case 'DECREMENT':
      return state - 1;

    case 'RESET':
      return 0;

    default:
      return state;
  }
}

test('still modifies the state', done => {
  const store = setup({ counter: reducer }, createPersistStateReducer<State>());
  store.dispatch({ type: 'INCREMENT' });
  store.dispatch({ type: 'INCREMENT' });
  store.dispatch({ type: 'INCREMENT' });
  store.subscribe(s => {
    expect(s).toEqual({ counter: 3 });
    teardown();
    done();
  });
});

test('persists state', done => {
  const store = setup({ counter: reducer }, createPersistStateReducer<State>());
  store.dispatch({ type: 'INCREMENT' });
  store.dispatch({ type: 'INCREMENT' });
  store.dispatch({ type: 'INCREMENT' });
  store.subscribe(() => {
    expect(JSON.parse(localStorage.getItem('__STATE__'))).toEqual({ counter: 3 });
    teardown();
    done();
  });
});

test('reads persisted state', done => {
  localStorage.setItem('__STATE__', '{"counter": 47}');
  const store = setup({ counter: reducer }, createPersistStateReducer<State>());
  store.dispatch({ type: 'INCREMENT' });
  store.subscribe(() => {
    expect(JSON.parse(localStorage.getItem('__STATE__'))).toEqual({ counter: 48 });
    teardown();
    done();
  });
});

test('uses the custom global key', done => {
  const store = setup({ counter: reducer }, createPersistStateReducer<State>({ globalKey: 'DONKEY' }));
  store.dispatch({ type: 'INCREMENT' });
  store.dispatch({ type: 'INCREMENT' });
  store.dispatch({ type: 'INCREMENT' });
  store.subscribe(() => {
    expect(JSON.parse(localStorage.getItem('DONKEY'))).toEqual({ counter: 3 });
    teardown();
    done();
  });
});

test('uses the serializer', done => {
  const serialize = jest.fn().mockReturnValue({});
  const store = setup({ counter: reducer }, createPersistStateReducer<State>({ defaultSerialize: serialize }));
  store.dispatch({ type: 'INCREMENT' });
  store.subscribe(_ => {
    expect(serialize).toBeCalled();
    teardown();
    done();
  });
});

test('uses the deserializer', done => {
  const deserialize = jest.fn();
  localStorage.setItem('__STATE__', '{"counter": 47}');
  const store = setup({ counter: reducer }, createPersistStateReducer<State>({ defaultDeserialize: deserialize }));
  store.subscribe(() => {
    expect(deserialize).toBeCalled();
    teardown();
    done();
  });
});

test('uses the storage', done => {
  const storage = new MockStorage();
  storage.setItem('__STATE__', '{"counter": 47}');
  const store = setup({ counter: reducer }, createPersistStateReducer<State>({ storage }));
  store.dispatch({ type: 'INCREMENT' });
  store.subscribe(() => {
    expect(JSON.parse(storage.getItem('__STATE__'))).toEqual({ counter: 48 });
    teardown();
    done();
  });
});
