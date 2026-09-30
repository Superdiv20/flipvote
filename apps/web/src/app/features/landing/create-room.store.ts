import { inject } from '@angular/core';
import type { Deck } from '@flipvote/protocol';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { toast } from '@spartan-ng/brain/sonner';
import { RoomApiError, RoomApiService } from '../../core/room-api';

type RoomCreateStoreState = {
  createRoomLoading: boolean;
};

const initialState: RoomCreateStoreState = {
  createRoomLoading: false,
};

export const CreateRoomStore = signalStore(
  withState(initialState),
  // this withMethods block is for handling simple api requests that don't require socket or session injection
  withMethods((store, roomApi = inject(RoomApiService)) => ({
    /** Resolves with the new room's id, or `null` when it failed (a toast has told the user). */
    async createRoom(name: string, deck: Deck, sessionToken: string): Promise<string | null> {
      patchState(store, { createRoomLoading: true });
      try {
        const roomId = await roomApi.createRoom(name, deck, sessionToken);
        patchState(store, { createRoomLoading: false });
        return roomId;
      } catch (error) {
        patchState(store, { createRoomLoading: false });
        toast.error(
          error instanceof RoomApiError
            ? 'The server could not create the room.'
            : 'Could not reach the server. Check your connection.',
        );
        return null;
      }
    },
  })),
);
