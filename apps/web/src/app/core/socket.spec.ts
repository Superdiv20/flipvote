import { TestBed } from '@angular/core/testing';
import type { ClientMessage } from '@flipvote/protocol';
import { RECONNECT_DELAYS_MS, SocketService } from './socket';

/** Stands in for the browser's WebSocket. Tests open, drop and read each connection by hand. */
class FakeWebSocket {
  static readonly OPEN = 1;
  static readonly all: FakeWebSocket[] = [];

  readyState = 0;
  readonly sent: ClientMessage[] = [];
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;

  constructor(readonly url: string) {
    FakeWebSocket.all.push(this);
  }

  send(raw: string): void {
    this.sent.push(JSON.parse(raw));
  }

  close(): void {
    this.readyState = 3;
    this.onclose?.();
  }

  /** The server accepted the connection. */
  accept(): void {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }

  /** The network dropped it. */
  drop(): void {
    this.readyState = 3;
    this.onclose?.();
  }
}

const latest = () => FakeWebSocket.all.at(-1)!;

describe('SocketService', () => {
  let socket: SocketService;

  beforeEach(() => {
    vi.useFakeTimers();
    FakeWebSocket.all.length = 0;
    vi.stubGlobal('WebSocket', FakeWebSocket);
    socket = TestBed.inject(SocketService);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('opens a connection and reports it', () => {
    socket.connect();
    expect(socket.status()).toBe('connecting');
    latest().accept();
    expect(socket.status()).toBe('open');
  });

  describe('a dropped connection', () => {
    it('is reported as reconnecting and opened again after a second', () => {
      socket.connect();
      latest().accept();
      latest().drop();
      expect(socket.status()).toBe('reconnecting');
      expect(FakeWebSocket.all).toHaveLength(1);

      vi.advanceTimersByTime(RECONNECT_DELAYS_MS[0]);
      expect(FakeWebSocket.all).toHaveLength(2);
      latest().accept();
      expect(socket.status()).toBe('open');
    });

    it('waits longer after each failed attempt, up to a limit', () => {
      socket.connect();
      latest().accept();

      const waits: number[] = [];
      for (let attempt = 0; attempt < RECONNECT_DELAYS_MS.length + 2; attempt++) {
        latest().drop();
        const before = FakeWebSocket.all.length;
        let waited = 0;
        while (FakeWebSocket.all.length === before) {
          vi.advanceTimersByTime(500);
          waited += 500;
        }
        waits.push(waited);
      }
      expect(waits).toEqual([1000, 2000, 4000, 8000, 10_000, 10_000, 10_000]);
    });

    it('starts the waits over once a connection succeeds again', () => {
      socket.connect();
      latest().accept();
      latest().drop();
      vi.advanceTimersByTime(1000);
      latest().drop();
      vi.advanceTimersByTime(2000);
      latest().accept();

      latest().drop();
      vi.advanceTimersByTime(999);
      expect(socket.status()).toBe('reconnecting');
      const before = FakeWebSocket.all.length;
      vi.advanceTimersByTime(1);
      expect(FakeWebSocket.all.length).toBe(before + 1);
    });

    it('tries again right away when the browser is back online', () => {
      socket.connect();
      latest().accept();
      latest().drop();
      window.dispatchEvent(new Event('online'));
      expect(FakeWebSocket.all).toHaveLength(2);
    });
  });

  describe('rejoining', () => {
    it('tells its listeners when a dropped connection is back, not on the first one', () => {
      const reconnects = vi.fn();
      socket.onReconnect(reconnects);
      socket.connect();
      latest().accept();
      expect(reconnects).not.toHaveBeenCalled();

      latest().drop();
      vi.advanceTimersByTime(1000);
      latest().accept();
      expect(reconnects).toHaveBeenCalledTimes(1);
    });

    it('lets listeners rejoin before the messages queued meanwhile go out', () => {
      socket.onReconnect(() =>
        socket.send({ type: 'join', roomId: 'r', name: 'Ana', sessionToken: 't' }),
      );
      socket.connect();
      latest().accept();
      latest().drop();

      socket.send({ type: 'vote', value: '5' });
      vi.advanceTimersByTime(1000);
      latest().accept();

      expect(latest().sent.map((message) => message.type)).toEqual(['join', 'vote']);
    });
  });

  describe('closing on purpose', () => {
    it('does not reconnect', () => {
      socket.connect();
      latest().accept();
      socket.disconnect();
      expect(socket.status()).toBe('closed');
      vi.advanceTimersByTime(60_000);
      expect(FakeWebSocket.all).toHaveLength(1);
    });

    it('calls off a pending attempt', () => {
      socket.connect();
      latest().accept();
      latest().drop();
      socket.disconnect();
      vi.advanceTimersByTime(60_000);
      expect(FakeWebSocket.all).toHaveLength(1);
      expect(socket.status()).toBe('closed');
    });
  });
});
