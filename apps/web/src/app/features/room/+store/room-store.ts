import { computed, inject } from '@angular/core';
import type {
  CardValue,
  ClientMessage,
  ErrorCode,
  RoomState,
  ServerMessage,
} from '@flipvote/protocol';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { SessionService } from '../../../core/session';
import { SocketService } from '../../../core/socket';
import { type IssueDetails, issueLabel, parseIssueTitle } from '../issues/issue-types';

type RoomStoreState = {
  /** The shared room state, the same for everyone in the room. `null` until the first `state` arrives. */
  room: RoomState | null;
  /** Our own seat, from `welcome`. */
  participantId: string | null;
  /** Our own vote in this round. Only we receive it; others see just `hasVoted` until the flip. */
  myVote: CardValue | null;
  /**
   * Why the join failed, e.g. `ROOM_NOT_FOUND` for a mistyped link or a closed room. Any error
   * before the first `state` belongs to the join, since nothing else can be sent before it.
   */
  joinError: ErrorCode | null;
  /** No display name was saved, so nothing has been sent yet and the page asks for one. */
  awaitingName: boolean;
};

const initialState: RoomStoreState = {
  room: null,
  participantId: null,
  myVote: null,
  joinError: null,
  awaitingName: false,
};

/** What the room page shows. */
type RoomView = 'notFound' | 'joinFailed' | 'name' | 'joining' | 'room';

/**
 * Room state as sent by the server. Actions only send intents; the state changes when the
 * server answers: the shared `state` for everyone, plus `welcome` and `myVote` for us alone.
 * Connects when a room visit starts and disconnects when it ends.
 */
export const RoomStore = signalStore(
  withState(initialState),
  withProps(() => ({
    /** Whether the socket to the server is open, for the live indicator. */
    connection: inject(SocketService).status,
  })),
  withComputed(({ room, participantId, joinError, awaitingName }) => {
    const participants = computed(() => room()?.participants ?? []);
    const issues = computed(() => room()?.issues ?? []);
    const currentIssueId = computed(() => room()?.currentIssueId ?? null);
    const currentIssue = computed(
      () => issues().find((issue) => issue.id === currentIssueId()) ?? null,
    );

    return {
      view: computed((): RoomView => {
        const error = joinError();
        if (error) return error === 'ROOM_NOT_FOUND' ? 'notFound' : 'joinFailed';
        if (awaitingName()) return 'name';
        return room() ? 'room' : 'joining';
      }),
      selfId: computed(() => participantId() ?? ''),
      roomName: computed(() => room()?.name ?? ''),
      deck: computed(() => room()?.deck.cards ?? []),
      participants,
      flipped: computed(() => room()?.phase === 'revealed'),
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
        patchState(store, { awaitingName: false, joinError: null });
        send({ type: 'join', roomId, name, sessionToken: session.token });
      },

      /**
       * Joins with the saved display name, e.g. right after creating the room or after a refresh.
       * Without a saved name it sends nothing and switches to the name prompt instead.
       */
      enter(roomId: string): void {
        const name = session.name();
        if (!name) {
          patchState(store, { awaitingName: true });
          return;
        }
        send({ type: 'join', roomId, name, sessionToken: session.token });
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

      _handleRoomUpdate(message: ServerMessage): void {
        switch (message.type) {
          case 'welcome':
            patchState(store, { participantId: message.participantId, myVote: message.myVote });
            break;
          case 'myVote':
            patchState(store, { myVote: message.value });
            break;
          case 'state': {
            // A new round clears every vote without a `myVote` message. The shared state shows it:
            // once our seat says `hasVoted: false`, we have no vote either.
            const self = message.room.participants.find((p) => p.id === store.participantId());
            patchState(store, {
              room: message.room,
              ...(self && !self.hasVoted ? { myVote: null } : {}),
            });
            break;
          }
          case 'error':
            // Before the first state, only the join can have failed: the page shows why.
            // Afterwards an error concerns a single intent, and the room stays.
            if (store.room() === null) patchState(store, { joinError: message.code });
            else console.warn(`[room] ${message.code}: ${message.message}`);
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
        stopListening = socket.onMessage((message) => store._handleRoomUpdate(message));
        socket.connect();
      },
      onDestroy(): void {
        stopListening?.();
        socket.disconnect();
      },
    };
  }),
);
