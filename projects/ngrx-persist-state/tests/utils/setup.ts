import { TestBed } from '@angular/core/testing';
import { Store, StoreModule } from '@ngrx/store';

export function setup<T>(reducer: any, persistReducer: any, initialState?: (() => Partial<T>)): Store<T> {
  TestBed.configureTestingModule({
    imports: [
      StoreModule.forRoot(reducer, {
        metaReducers: [persistReducer],
        initialState,
      }),
    ],
  });

  return TestBed.get(Store);
}

export function teardown() {
  localStorage.clear();
}
