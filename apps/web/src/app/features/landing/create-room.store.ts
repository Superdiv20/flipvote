import { inject } from '@angular/core';
import type { DeckId, ErrorCode } from '@flipvote/protocol';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { toast } from '@spartan-ng/brain/sonner';
import { RoomApiError, RoomApiService } from '../../core/room-api';
import { SessionService } from '../../core/session';
import { CREATE_ROOM_ERRORS } from './create-room-error-types';

type RoomCreateStoreState = {
  createRoomLoading: boolean;
};

const initialState: RoomCreateStoreState = {
  createRoomLoading: false,
};

export const CreateRoomStore = signalStore(
  withState(initialState),
  // this withMethods block is for handling simple api requests that don't require socket or session injection
  withMethods((store, roomApi = inject(RoomApiService), session = inject(SessionService)) => ({
    /** Resolves with the new room's id, or `null` when it failed (a toast has told the user). */
    async createRoom(
      name: string,
      displayName: string,
      deckId: DeckId,
      sessionToken: string,
    ): Promise<string | null> {
      patchState(store, { createRoomLoading: true });
      try {
        const roomId = await roomApi.createRoom({ name, deckId }, sessionToken);
        patchState(store, { createRoomLoading: false });
        session.setName(displayName);
        return roomId;
      } catch (error) {
        patchState(store, { createRoomLoading: false });
        toast.error(createRoomErrorMessage(error));
        return null;
      } finally {
        patchState(store, { createRoomLoading: false });
      }
    },
  })),
);

function createRoomErrorMessage(error: unknown): string {
  // `fetch` rejects with a TypeError when the request never reached the server.
  if (!(error instanceof RoomApiError)) return 'Could not reach the server. Check your connection.';
  const known = error.code && CREATE_ROOM_ERRORS[error.code];
  if (known) return known;
  if (error.status >= 500) return 'The server ran into a problem. Try again in a moment.';
  return 'The room could not be created. Please try again.';
}
