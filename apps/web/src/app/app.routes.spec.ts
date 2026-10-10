import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import type { ServerMessage } from '@flipvote/protocol';
import { SessionService } from './core/session';
import { SocketService } from './core/socket';
import { RoomStore } from './features/room/+store/room-store';
import { routes } from './app.routes';

/** A socket that never answers by itself; the test delivers server messages by hand. */
function silentSocket() {
  const handlers = new Set<(message: ServerMessage) => void>();
  return {
    status: signal('open' as const).asReadonly(),
    connect() {},
    disconnect() {},
    send() {},
    onReconnect: () => () => {},
    onMessage(handler: (message: ServerMessage) => void) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
    deliver(message: ServerMessage) {
      for (const handler of handlers) handler(message);
    },
  };
}

describe('room route', () => {
  it('gives every room visit a fresh store', async () => {
    const socket = silentSocket();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        { provide: SocketService, useValue: socket },
      ],
    });
    TestBed.inject(SessionService).setName('Ana');
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/r/missing');
    const first = harness.routeDebugElement!.injector.get(RoomStore);
    socket.deliver({
      type: 'error',
      code: 'ROOM_NOT_FOUND',
      message: 'This room does not exist or has closed.',
    });
    expect(first.view()).toBe('notFound');

    // "Create a new room" goes to the landing page, then on to the new room.
    await harness.navigateByUrl('/createRoom');
    await harness.navigateByUrl('/r/new-room');
    const second = harness.routeDebugElement!.injector.get(RoomStore);

    expect(second).not.toBe(first);
    expect(second.view()).toBe('joining');
  });
});
