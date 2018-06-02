import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { StoreModule, ActionReducer, MetaReducer, Action } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

import { AppComponent } from './app.component';

import { createPersistStateReducer } from 'ngrx-persist-state';

@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    StoreDevtoolsModule.instrument({
      name: 'NgRx Persist Statenpm',
    }),
  ],
  declarations: [AppComponent],
  bootstrap: [AppComponent],
})
export class AppModule {}
