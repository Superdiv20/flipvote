import { inject } from '@angular/core';
import type { DeckId } from '@flipvote/protocol';
import { TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { toast } from '@spartan-ng/brain/sonner';
import { RoomApiError, RoomApiService } from '../../core/room-api';
import { SessionService } from '../../core/session';
import { ERROR_PARAMS, errorKey } from '../../shared/error-keys';
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
  withMethods(
    (
      store,
      roomApi = inject(RoomApiService),
      session = inject(SessionService),
      transloco = inject(TranslocoService),
    ) => ({
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
          toast.error(transloco.translate(createRoomErrorKey(error), ERROR_PARAMS));
          return null;
        } finally {
          patchState(store, { createRoomLoading: false });
        }
      },
    }),
  ),
);

function createRoomErrorKey(error: unknown): string {
  // `fetch` rejects with a TypeError when the request never reached the server.
  if (!(error instanceof RoomApiError)) return marker('landing.errors.unreachable');
  if (error.code) return CREATE_ROOM_ERRORS[error.code] ?? errorKey(error.code);
  if (error.status >= 500) return marker('landing.errors.serverError');
  return marker('landing.errors.failed');
}
