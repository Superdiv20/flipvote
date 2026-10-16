import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import type { ServerMessage } from '@flipvote/protocol';
import { SessionService } from './core/session';
import { SocketService } from './core/socket';
import { provideTranslatedTitles } from './core/translated-title';
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

describe('unknown addresses', () => {
  async function visit(url: string) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideTranslatedTitles(),
        { provide: SocketService, useValue: silentSocket() },
      ],
    });
    TestBed.inject(SessionService).setName('Ana');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    return harness.routeNativeElement as HTMLElement;
  }

  it.each(['/does-not-exist', '/r', '/r/abc/extra', '/createRoom/again'])(
    'shows the 404 page for %p',
    async (url) => {
      const page = await visit(url);
      expect(page.querySelector('h1')?.textContent).toContain('Page not found');
      expect(page.querySelector('a[href="/createRoom"]')?.textContent).toContain(
        'Create a new room',
      );
    },
  );

  it('names the tab after it', async () => {
    await visit('/does-not-exist');
    await new Promise((resolve) => setTimeout(resolve));
    expect(document.title).toBe('Page not found · Flipvote');
  });

  it.each([
    ['/', 'flipvote-landing-page'],
    ['/createRoom', 'flipvote-create-room-page'],
    ['/r/abc', 'flipvote-room-page'],
  ])('leaves %p to its own page', async (url, selector) => {
    const page = await visit(url);
    expect(page.tagName.toLowerCase()).toBe(selector);
  });
});
