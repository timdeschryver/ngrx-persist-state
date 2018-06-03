import { Action } from '@ngrx/store';
import { setup, teardown } from './utils';

import { createPersistStateReducer } from '../src/public_api';

interface State {
  deep: {
    this: {
      is: {
        my: {
          deep: {
            state: {
              value: string;
            };
          };
        };
      };
    };
  };
}

const initialState = {
  this: {
    is: {
      my: {
        deep: {
          state: {
            value: 'You found me!',
          },
        },
      },
    },
  },
};

function reducer(state = initialState, action: Action) {
  return state;
}

test('persists a deep slice of the state', done => {
  const store = setup(
    { deep: reducer },
    createPersistStateReducer<State>({
      keys: {
        deep: {
          this: {
            is: {
              my: true,
            },
          },
        },
      },
    }),
  );
  store.subscribe(() => {
    expect(JSON.parse(localStorage.getItem('deep.this.is.my'))).toEqual(initialState.this.is.my);
    teardown();
    done();
  });
});

test('persists a deeper slice of the state', done => {
  const store = setup(
    { deep: reducer },
    createPersistStateReducer<State>({
      keys: {
        deep: {
          this: {
            is: {
              my: {
                deep: {
                  state: {
                    value: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
  );
  store.subscribe(() => {
    expect(JSON.parse(localStorage.getItem('deep.this.is.my.deep.state.value'))).toBe(initialState.this.is.my.deep.state.value);
    teardown();
    done();
  });
});

test('reads a persistsed deep slice of the state', done => {
  localStorage.setItem('deep.this.is.my', '{"deep": { "state": { "value": "GOTCHA" }}}');
  const store = setup(
    { deep: reducer },
    createPersistStateReducer<State>({
      keys: {
        deep: {
          this: {
            is: {
              my: true,
            },
          },
        },
      },
    }),
  );
  store.subscribe((s: State) => {
    expect(s.deep).toEqual({
      this: {
        is: {
          my: {
            deep: {
              state: {
                value: 'GOTCHA',
              },
            },
          },
        },
      },
    });
    teardown();
    done();
  });
});
