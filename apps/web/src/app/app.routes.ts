import { Routes } from '@angular/router';
import { CreateRoomStore } from './features/landing/create-room.store';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'createRoom' },
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
];
