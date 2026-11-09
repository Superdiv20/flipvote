import { Routes } from '@angular/router';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { CreateRoomStore } from './features/landing/create-room.store';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    // Route titles are translation keys, see TranslatedTitleStrategy.
    title: marker('landing.meta.title'),
    loadComponent: () => import('./features/landing/landing-page').then((m) => m.LandingPage),
  },
  {
    path: 'createRoom',
    loadComponent: () =>
      import('./features/landing/create-room-page').then((m) => m.CreateRoomPage),
    providers: [CreateRoomStore],
  },
  {
    path: 'r/:roomId',
    // RoomPage provides its own RoomStore. Route providers live as long as the router, so they
    // would hand the next visit the previous room's store.
    loadComponent: () => import('./features/room/room-page').then((m) => m.RoomPage),
  },
  {
    // Last, as the router takes the first match: everything no route above knows.
    path: '**',
    // Route titles are translation keys, see TranslatedTitleStrategy.
    title: marker('notFound.pageTitle'),
    loadComponent: () => import('./features/not-found/not-found-page').then((m) => m.NotFoundPage),
  },
];
