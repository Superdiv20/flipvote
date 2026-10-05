import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  type ClientMessage,
  DECKS,
  type Participant,
  type RoomState,
  type ServerMessage,
} from '@flipvote/protocol';
import { SessionService } from '../../../core/session';
import { type ConnectionStatus, SocketService } from '../../../core/socket';
import { RoomStore } from './room-store';

/** Records what the store sends and lets a test deliver server messages by hand. */
class FakeSocket implements Pick<
  SocketService,
  'status' | 'connect' | 'disconnect' | 'send' | 'onMessage'
> {
  readonly status = signal<ConnectionStatus>('idle');
  readonly sent: ClientMessage[] = [];
  readonly handlers = new Set<(message: ServerMessage) => void>();
  connected = false;

  connect(): void {
    this.connected = true;
  }

  disconnect(): void {
    this.connected = false;
  }

  send(message: ClientMessage): void {
    this.sent.push(message);
  }

  onMessage(handler: (message: ServerMessage) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  receive(message: ServerMessage): void {
    for (const handler of this.handlers) handler(message);
  }
}

function seat(id: string, hasVoted: boolean): Participant {
  return { id, name: id.toUpperCase(), isSpectator: false, connected: true, hasVoted };
}

function shared(participants: Participant[], phase: RoomState['phase'] = 'voting'): RoomState {
  return {
    id: 'room-1',
    name: 'Sprint 42',
    deck: DECKS.fibonacci,
    phase,
    facilitatorId: 'ana',
    participants,
    issues: [],
    currentIssueId: null,
    result: null,
  };
}

describe('RoomStore', () => {
  let socket: FakeSocket;

  function setup() {
    socket = new FakeSocket();
    TestBed.configureTestingModule({
      providers: [RoomStore, { provide: SocketService, useValue: socket }],
    });
    return TestBed.inject(RoomStore);
  }

  beforeEach(() => localStorage.clear());

  describe('connection', () => {
    it('reports the socket’s connection status', () => {
      const store = setup();
      expect(store.connection()).toBe('idle');
      socket.status.set('connecting');
      expect(store.connection()).toBe('connecting');
      socket.status.set('open');
      expect(store.connection()).toBe('open');
    });

    it('connects when created and listens for messages', () => {
      setup();
      expect(socket.connected).toBe(true);
      expect(socket.handlers.size).toBe(1);
    });

    it('stops listening and disconnects when the room visit ends', () => {
      setup();
      TestBed.resetTestingModule();
      expect(socket.handlers.size).toBe(0);
      expect(socket.connected).toBe(false);
    });

    it('starts empty until the server answers', () => {
      const store = setup();
      expect(store.selfId()).toBe('');
      expect(store.myVote()).toBeNull();
      expect(store.participants()).toEqual([]);
    });
  });

  describe('joining', () => {
    it('enters with the saved name and the session token', () => {
      const store = setup();
      const session = TestBed.inject(SessionService);
      session.setName('Ana');
      store.enter('room-1');
      expect(socket.sent).toEqual([
        { type: 'join', roomId: 'room-1', name: 'Ana', sessionToken: session.token },
      ]);
      expect(store.view()).toBe('joining');
    });

    it('sends nothing without a saved name and asks for one', () => {
      const store = setup();
      store.enter('room-1');
      expect(socket.sent).toEqual([]);
      expect(store.view()).toBe('name');
    });

    it('joins with the entered name and leaves the name prompt', () => {
      const store = setup();
      store.enter('room-1');
      store.join('room-1', 'Cy');
      expect(socket.sent).toEqual([
        {
          type: 'join',
          roomId: 'room-1',
          name: 'Cy',
          sessionToken: TestBed.inject(SessionService).token,
        },
      ]);
      expect(store.view()).toBe('joining');
    });

    it('saves the name used to join for the next visit', () => {
      const store = setup();
      store.join('room-1', 'Ben');
      expect(TestBed.inject(SessionService).name()).toBe('Ben');
    });
  });

  describe('view', () => {
    it('is joining until the first state arrives, then shows the room', () => {
      const store = setup();
      TestBed.inject(SessionService).setName('Ana');
      store.enter('room-1');
      socket.receive({ type: 'welcome', participantId: 'ana', myVote: null });
      expect(store.view()).toBe('joining');
      socket.receive({ type: 'state', room: shared([seat('ana', false)]) });
      expect(store.view()).toBe('room');
    });

    it('shows not found after the name prompt when the room does not exist', () => {
      const store = setup();
      store.enter('no-such-room');
      store.join('no-such-room', 'Cy');
      socket.receive({
        type: 'error',
        code: 'ROOM_NOT_FOUND',
        message: 'This room does not exist or has closed.',
      });
      expect(store.view()).toBe('notFound');
    });

    it('shows why the join failed for any other error before the room arrives', () => {
      const store = setup();
      TestBed.inject(SessionService).setName('Ana');
      store.enter('room-1');
      socket.receive({
        type: 'error',
        code: 'INVALID_SESSION',
        message: 'Your session could not be verified.',
      });
      expect(store.view()).toBe('joinFailed');
      expect(store.joinError()).toBe('INVALID_SESSION');
    });

    it('clears a failed join when joining again', () => {
      const store = setup();
      socket.receive({ type: 'error', code: 'NAME_REQUIRED', message: 'A name is required.' });
      store.join('room-1', 'Cy');
      expect(store.joinError()).toBeNull();
      expect(store.view()).toBe('joining');
    });

    it('keeps showing the room once it has arrived, whatever error follows', () => {
      const store = setup();
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      socket.receive({ type: 'state', room: shared([seat('ana', false)]) });
      socket.receive({
        type: 'error',
        code: 'ROOM_NOT_FOUND',
        message: 'This room does not exist or has closed.',
      });
      expect(store.view()).toBe('room');
      expect(store.joinError()).toBeNull();
      vi.restoreAllMocks();
    });
  });

  describe('welcome', () => {
    it('sets our own seat', () => {
      const store = setup();
      socket.receive({ type: 'welcome', participantId: 'ben', myVote: null });
      expect(store.selfId()).toBe('ben');
    });

    it('restores our vote after a refresh while voting', () => {
      const store = setup();
      socket.receive({ type: 'welcome', participantId: 'ben', myVote: '8' });
      socket.receive({ type: 'state', room: shared([seat('ana', false), seat('ben', true)]) });
      expect(store.myVote()).toBe('8');
    });
  });

  describe('myVote', () => {
    it('updates our vote without touching the shared state', () => {
      const store = setup();
      const room = shared([seat('ana', false), seat('ben', false)]);
      socket.receive({ type: 'welcome', participantId: 'ben', myVote: null });
      socket.receive({ type: 'state', room });
      socket.receive({ type: 'myVote', value: '5' });
      expect(store.myVote()).toBe('5');
      expect(store.participants()).toEqual(room.participants);
    });

    it('can withdraw the vote', () => {
      const store = setup();
      socket.receive({ type: 'welcome', participantId: 'ben', myVote: '5' });
      socket.receive({ type: 'myVote', value: null });
      expect(store.myVote()).toBeNull();
    });
  });

  describe('state', () => {
    it('applies the shared state', () => {
      const store = setup();
      socket.receive({
        type: 'state',
        room: shared([seat('ana', true), seat('ben', false)], 'revealed'),
      });
      expect(store.roomName()).toBe('Sprint 42');
      expect(store.flipped()).toBe(true);
      expect(store.votedCount()).toBe(1);
    });

    it('keeps our vote while our seat has voted', () => {
      const store = setup();
      socket.receive({ type: 'welcome', participantId: 'ben', myVote: null });
      socket.receive({ type: 'myVote', value: '5' });
      socket.receive({ type: 'state', room: shared([seat('ana', true), seat('ben', true)]) });
      expect(store.myVote()).toBe('5');
    });

    it('clears our vote when a new round shows our seat without a vote', () => {
      const store = setup();
      socket.receive({ type: 'welcome', participantId: 'ben', myVote: '5' });
      socket.receive({
        type: 'state',
        room: shared([seat('ana', true), seat('ben', true)], 'revealed'),
      });
      socket.receive({ type: 'state', room: shared([seat('ana', false), seat('ben', false)]) });
      expect(store.myVote()).toBeNull();
    });

    it('keeps our vote when someone else’s seat changes', () => {
      const store = setup();
      socket.receive({ type: 'welcome', participantId: 'ben', myVote: '5' });
      socket.receive({ type: 'state', room: shared([seat('ana', false), seat('ben', true)]) });
      socket.receive({ type: 'state', room: shared([seat('ana', true), seat('ben', true)]) });
      expect(store.myVote()).toBe('5');
    });

    it('leaves our vote alone while our seat is still unknown', () => {
      const store = setup();
      socket.receive({ type: 'myVote', value: '5' });
      socket.receive({ type: 'state', room: shared([seat('ana', false)]) });
      expect(store.myVote()).toBe('5');
    });
  });

  describe('errors', () => {
    it('marks the room as not found', () => {
      const store = setup();
      expect(store.view()).not.toBe('notFound');
      socket.receive({
        type: 'error',
        code: 'ROOM_NOT_FOUND',
        message: 'This room does not exist or has closed.',
      });
      expect(store.view()).toBe('notFound');
    });

    it('keeps the room for errors about a single intent', () => {
      const store = setup();
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      socket.receive({ type: 'state', room: shared([seat('ana', false)]) });
      socket.receive({
        type: 'error',
        code: 'NOT_FACILITATOR',
        message: 'Only the facilitator can do that.',
      });
      expect(store.view()).toBe('room');
      vi.restoreAllMocks();
    });

    it('changes nothing', () => {
      const store = setup();
      socket.receive({ type: 'welcome', participantId: 'ben', myVote: '5' });
      socket.receive({ type: 'state', room: shared([seat('ana', false), seat('ben', true)]) });
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      socket.receive({
        type: 'error',
        code: 'NOT_FACILITATOR',
        message: 'Only the facilitator can do that.',
      });
      expect(warn).toHaveBeenCalledWith(
        '[room] NOT_FACILITATOR: Only the facilitator can do that.',
      );
      expect(store.myVote()).toBe('5');
      expect(store.selfId()).toBe('ben');
      expect(store.votedCount()).toBe(1);
      warn.mockRestore();
    });
  });

  describe('voting', () => {
    it('sends the picked card', () => {
      const store = setup();
      store.vote('5');
      expect(socket.sent).toEqual([{ type: 'vote', value: '5' }]);
    });

    it('withdraws when the same card is picked again', () => {
      const store = setup();
      socket.receive({ type: 'myVote', value: '5' });
      store.vote('5');
      expect(socket.sent).toEqual([{ type: 'vote', value: null }]);
    });

    it('changes the vote when another card is picked', () => {
      const store = setup();
      socket.receive({ type: 'myVote', value: '5' });
      store.vote('8');
      expect(socket.sent).toEqual([{ type: 'vote', value: '8' }]);
    });
  });
});
