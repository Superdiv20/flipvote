import { Routes } from '@angular/router';
import { RoomStore } from './features/room/+store/room-store';

export const routes: Routes = [
  // No landing page yet, so the root opens a demo room.
  { path: '', pathMatch: 'full', redirectTo: 'room/demo' },
  {
    path: 'room/:roomId',
    loadComponent: () => import('./features/room/room-page').then((m) => m.RoomPage),
    providers: [RoomStore],
  },
];
