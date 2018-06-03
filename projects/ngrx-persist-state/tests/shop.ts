import { Action, StoreModule, Store, ActionReducerMap } from '@ngrx/store';
import { setup, teardown, MockStorage } from './utils';

import { createPersistStateReducer } from '../src/public_api';

interface State {
  catalog: CatalogState;
  cart: CartState;
}

const reducers: ActionReducerMap<State> = {
  catalog: catalogReducer,
  cart: cartReducer,
};

const products = [
  {
    name: 'pineapple',
    price: 3,
    sku: 'FRT-001',
  },
  {
    name: 'peach',
    price: 1,
    sku: 'FRT-002',
  },
  {
    name: 'cherry',
    price: 0.2,
    sku: 'FRT-003',
  },
];

test('persists whole state', done => {
  const store = setup(reducers, createPersistStateReducer<State>());
  store.dispatch(new LoadCatalog({ products: [...products] }));
  store.dispatch(new AddToCart({ sku: 'FRT-001' }));
  const expected = {
    cart: {
      cartItems: {
        'FRT-001': 1,
      },
    },
    catalog: {
      productSkus: ['FRT-001', 'FRT-002', 'FRT-003'],
      products: {
        'FRT-001': {
          name: 'pineapple',
          price: 3,
          sku: 'FRT-001',
        },
        'FRT-002': {
          name: 'peach',
          price: 1,
          sku: 'FRT-002',
        },
        'FRT-003': {
          name: 'cherry',
          price: 0.2,
          sku: 'FRT-003',
        },
      },
    },
  };
  store.subscribe(s => {
    expect(s).toEqual(expected);
    expect(JSON.parse(localStorage.getItem('__STATE__'))).toEqual(expected);
    teardown();
    done();
  });
});

test('persists a slice of the state', done => {
  const store = setup(
    reducers,
    createPersistStateReducer<State>({
      keys: {
        cart: true,
      },
    }),
  );
  store.dispatch(new LoadCatalog({ products: [...products] }));
  store.dispatch(new AddToCart({ sku: 'FRT-001' }));
  store.subscribe(() => {
    expect(localStorage.getItem('__STATE__')).toBeUndefined();
    expect(JSON.parse(localStorage.getItem('cart'))).toEqual({
      cartItems: {
        'FRT-001': 1,
      },
    });
    expect(localStorage.getItem('catalog')).toBeUndefined();
    teardown();
    done();
  });
});

test('persists multiple slices of the state', done => {
  const store = setup(
    reducers,
    createPersistStateReducer<State>({
      keys: {
        cart: true,
        catalog: true,
      },
    }),
  );
  store.dispatch(new LoadCatalog({ products: [...products] }));
  store.dispatch(new AddToCart({ sku: 'FRT-001' }));
  store.subscribe(() => {
    expect(localStorage.getItem('__STATE__')).toBeUndefined();
    expect(JSON.parse(localStorage.getItem('cart'))).toBeDefined();
    expect(JSON.parse(localStorage.getItem('catalog'))).toBeDefined();
    teardown();
    done();
  });
});

test('persists a slice of the state with a custom serializer', done => {
  const serialize = jest.fn().mockImplementation((value: any) => JSON.stringify(value));
  const store = setup(
    reducers,
    createPersistStateReducer<State>({
      keys: {
        cart: {
          serialize,
          deserialize: (value: string) => JSON.parse(value),
        },
      },
    }),
  );
  store.dispatch(new LoadCatalog({ products: [...products] }));
  store.dispatch(new AddToCart({ sku: 'FRT-001' }));
  store.subscribe(() => {
    expect(JSON.parse(localStorage.getItem('cart'))).toEqual({
      cartItems: {
        'FRT-001': 1,
      },
    });
    expect(serialize).toHaveBeenCalled();
    teardown();
    done();
  });
});

test('reads a persisted slice of the state', done => {
  localStorage.setItem('cart', '{"cartItems":{"FRT-001":1}}');
  const store = setup(
    reducers,
    createPersistStateReducer<State>({
      keys: {
        cart: true,
      },
    }),
  );
  store.dispatch(new LoadCatalog({ products: [...products] }));
  store.dispatch(new AddToCart({ sku: 'FRT-001' }));
  store.dispatch(new AddToCart({ sku: 'FRT-002' }));
  store.subscribe(() => {
    expect(JSON.parse(localStorage.getItem('cart'))).toEqual({
      cartItems: {
        'FRT-001': 2,
        'FRT-002': 1,
      },
    });
    teardown();
    done();
  });
});

test('reads multiple persisted slices of the state', done => {
  localStorage.setItem('cart', '{"cartItems":{"FRT-001":1}}');
  localStorage.setItem('catalog', JSON.stringify(products));
  const store = setup(
    reducers,
    createPersistStateReducer<State>({
      keys: {
        cart: true,
      },
    }),
  );
  store.dispatch(new AddToCart({ sku: 'FRT-001' }));
  store.dispatch(new AddToCart({ sku: 'FRT-002' }));
  store.subscribe(() => {
    expect(JSON.parse(localStorage.getItem('cart'))).toEqual({
      cartItems: {
        'FRT-001': 2,
        'FRT-002': 1,
      },
    });
    expect(JSON.parse(localStorage.getItem('catalog'))).toEqual(products);
    teardown();
    done();
  });
});

test('reads a persisted slice of the state with a custom deserializer', done => {
  localStorage.setItem('cart', '{"cartItems":{"FRT-001":1}}');
  const deserialize = jest.fn().mockImplementation((value: string) => JSON.parse(value));
  const store = setup(
    reducers,
    createPersistStateReducer<State>({
      keys: {
        cart: {
          deserialize,
          serialize: (value: any) => JSON.stringify(value),
        },
      },
    }),
  );
  store.dispatch(new LoadCatalog({ products: [...products] }));
  store.dispatch(new AddToCart({ sku: 'FRT-001' }));
  store.dispatch(new AddToCart({ sku: 'FRT-002' }));
  store.subscribe(() => {
    expect(JSON.parse(localStorage.getItem('cart'))).toEqual({
      cartItems: {
        'FRT-001': 2,
        'FRT-002': 1,
      },
    });
    expect(deserialize).toHaveBeenCalled();
    teardown();
    done();
  });
});

interface Product {
  name: string;
  sku: string;
  price: number;
}

export enum CatalogActionTypes {
  Load = "[Catalog 'API'] Load",
}

export class LoadCatalog implements Action {
  readonly type = CatalogActionTypes.Load;
  constructor(public payload: { products: Product[] }) {}
}

export type CatalogActions = LoadCatalog;

interface CatalogState {
  products: { [sku: string]: Product };
  productSkus: string[];
}

function catalogReducer(state: CatalogState = { products: {}, productSkus: [] }, action: CatalogActions) {
  switch (action.type) {
    case CatalogActionTypes.Load:
      return {
        products: action.payload.products.reduce((obj, product) => {
          obj[product.sku] = product;
          return obj;
        }, {}),
        productSkus: action.payload.products.map(product => product.sku),
      };

    default:
      return state;
  }
}

export enum CartActionTypes {
  AddToCart = '[Product List] Add to cart',
  RemoveFromCart = '[Product List] Remove from cart',
  EmptyCart = '[Cart] Empty cart',
}

export class AddToCart implements Action {
  readonly type = CartActionTypes.AddToCart;
  constructor(public payload: { sku: string }) {}
}

export class RemoveFromCart implements Action {
  readonly type = CartActionTypes.RemoveFromCart;
  constructor(public payload: { sku: string }) {}
}

export class EmptyCart implements Action {
  readonly type = CartActionTypes.EmptyCart;
}

export type CartActions = AddToCart | RemoveFromCart | EmptyCart;

interface CartState {
  cartItems: { [sku: string]: number };
}

function cartReducer(state: CartState = { cartItems: {} }, action: CartActions) {
  switch (action.type) {
    case CartActionTypes.AddToCart:
      return {
        ...state,
        cartItems: {
          ...state.cartItems,
          [action.payload.sku]: (state.cartItems[action.payload.sku] || 0) + 1,
        },
      };

    case CartActionTypes.RemoveFromCart:
      return {
        ...state,
        cartItems: {
          ...state.cartItems,
          [action.payload.sku]: Math.max((state.cartItems[action.payload.sku] || 0) - 1, 0),
        },
      };

    case CartActionTypes.EmptyCart:
      return { cartItems: {} };

    default:
      return state;
  }
}
