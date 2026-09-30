import { Routes } from '@angular/router';
import { RoomStore } from './features/room/+store/room-store';
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
    path: 'room/:roomId',
    loadComponent: () => import('./features/room/room-page').then((m) => m.RoomPage),
    providers: [RoomStore],
  },
];
