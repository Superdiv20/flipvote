import { computed, inject } from '@angular/core';
import type { ClientMessage, Deck, RoomState, ServerMessage } from '@flipvote/protocol';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { SessionService } from '../../../core/session';
import { SocketService } from '../../../core/socket';
import { type IssueDetails, issueLabel, parseIssueTitle } from '../issues/issue-types';

type RoomStoreState = {
  /** The room as the server last sent it. `null` until the first `state` message arrives. */
  room: RoomState | null;
};

const initialState: RoomStoreState = { room: null };

/**
 * Room state as sent by the server. Actions only send intents; the state changes when the
 * server answers. Connects when a room visit starts and disconnects when it ends.
 */
export const RoomStore = signalStore(
  withState(initialState),
  withComputed(({ room }) => {
    const participants = computed(() => room()?.participants ?? []);
    const issues = computed(() => room()?.issues ?? []);
    const currentIssueId = computed(() => room()?.currentIssueId ?? null);
    const currentIssue = computed(
      () => issues().find((issue) => issue.id === currentIssueId()) ?? null,
    );

    return {
      selfId: computed(() => room()?.selfId ?? ''),
      roomName: computed(() => room()?.name ?? ''),
      deck: computed(() => room()?.deck.cards ?? []),
      participants,
      flipped: computed(() => room()?.phase === 'revealed'),
      myVote: computed(() => room()?.myVote ?? null),
      results: computed(() => room()?.result ?? null),
      votedCount: computed(() => participants().filter((p) => p.hasVoted).length),
      issues,
      currentIssueId,
      currentIssue,
      topic: computed(() => {
        const issue = currentIssue();
        return issue ? issueLabel(issue) : null;
      }),
    };
  }),
  withMethods((store, socket = inject(SocketService), session = inject(SessionService)) => {
    const send = (message: ClientMessage) => socket.send(message);

    return {
      /** Takes a seat, or the same seat again after a refresh. Remembers the name for the next visit. */
      join(roomId: string, name: string): void {
        session.setName(name);
        send({ type: 'join', roomId, name, sessionToken: session.token });
      },

      /**
       * Joins with the saved display name, e.g. right after creating the room or after a refresh.
       * Returns `false` when no name is saved yet, so the page can ask for one.
       */
      enter(roomId: string): boolean {
        const name = session.name();
        if (!name) return false;
        send({ type: 'join', roomId, name, sessionToken: session.token });
        return true;
      },

      /** Picks a card, or withdraws the vote when the same card is picked again. */
      vote(value: string): void {
        send({ type: 'vote', value: store.myVote() === value ? null : value });
      },

      flip(): void {
        send({ type: 'flip' });
      },

      /** Starts a new round. The server records the estimate and moves on to the next open issue. */
      reset(): void {
        send({ type: 'reset' });
      },

      selectIssue(id: string): void {
        send({ type: 'selectIssue', issueId: id });
      },

      /** Quick add: one issue from a single line. */
      addIssue(text: string): void {
        const parsed = parseIssueTitle(text);
        if (parsed) send({ type: 'addIssue', issue: parsed });
      },

      /** Adds an issue from the full dialog. A leading tracker key in the title is split off like in quick add. */
      createIssue(details: IssueDetails): void {
        const parsed = parseIssueTitle(details.title);
        if (parsed) send({ type: 'addIssue', issue: { ...details, ...parsed } });
      },

      updateIssue(id: string, details: IssueDetails): void {
        send({ type: 'updateIssue', issueId: id, changes: details });
      },

      _handle(message: ServerMessage): void {
        switch (message.type) {
          case 'welcome':
            break;
          case 'state':
            patchState(store, { room: message.room });
            break;
          case 'error':
            console.warn(`[room] ${message.code}: ${message.message}`);
            break;
        }
      },
    };
  }),
  withHooks((store) => {
    const socket = inject(SocketService);
    let stopListening: (() => void) | undefined;

    return {
      onInit(): void {
        // Listen first, so no message that arrives right after connecting is missed.
        stopListening = socket.onMessage((message) => store._handle(message));
        socket.connect();
      },
      onDestroy(): void {
        stopListening?.();
        socket.disconnect();
      },
    };
  }),
);
