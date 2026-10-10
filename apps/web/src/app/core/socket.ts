import { DestroyRef, DOCUMENT, inject, Service, signal } from '@angular/core';
import type { ClientMessage, ServerMessage } from '@flipvote/protocol';
import { APP_CONFIG } from './config';

/**
 * - `connecting`: the first connection is being opened.
 * - `reconnecting`: it dropped and a new one is on its way, after a short wait.
 * - `closed`: closed on purpose, with `disconnect()`.
 */
export type ConnectionStatus = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed';

type MessageHandler = (message: ServerMessage) => void;

/** Waits between reconnect attempts: 1 s, 2 s, 4 s, 8 s, then 10 s for as long as it takes. */
export const RECONNECT_DELAYS_MS = [1000, 2000, 4000, 8000, 10_000] as const;

/**
 * One WebSocket connection to the server. Sends `ClientMessage`s and hands incoming
 * `ServerMessage`s to its listeners. Knows nothing about rooms: when a dropped connection comes
 * back, it only tells its `onReconnect` listeners, who decide what to send again.
 */
@Service()
export class SocketService {
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly wsURL = toSocketUrl(inject(APP_CONFIG).wsUrl, inject(DOCUMENT).baseURI);

  private socket: WebSocket | null = null;
  /** Messages sent while no socket was open, flushed once one is. */
  private readonly outbox: ClientMessage[] = [];
  private readonly handlers = new Set<MessageHandler>();
  private readonly reconnectHandlers = new Set<() => void>();

  /** Between `connect()` and `disconnect()`: a dropped connection is opened again. */
  private wanted = false;
  private attempt = 0;
  private retryTimer: ReturnType<typeof setTimeout> | undefined;

  private readonly _status = signal<ConnectionStatus>('idle');
  readonly status = this._status.asReadonly();

  constructor() {
    // Back online: don't wait for the next attempt.
    const onOnline = () => {
      if (this._status() === 'reconnecting') this.retryNow();
    };
    this.window?.addEventListener('online', onOnline);
    inject(DestroyRef).onDestroy(() => {
      this.window?.removeEventListener('online', onOnline);
      clearTimeout(this.retryTimer);
    });
  }

  connect(): void {
    this.wanted = true;
    if (this.socket || this.retryTimer) return;
    this._status.set('connecting');
    this.open();
  }

  disconnect(): void {
    this.wanted = false;
    clearTimeout(this.retryTimer);
    this.retryTimer = undefined;
    this.attempt = 0;
    this.socket?.close();
    this.socket = null;
    this.outbox.length = 0;
    this._status.set('closed');
  }

  send(message: ClientMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      this.outbox.push(message);
    }
  }

  /** Registers a listener for incoming messages and returns a function that removes it. */
  onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /**
   * Called each time a dropped connection is open again, before the messages queued meanwhile are
   * sent, so a listener can rejoin first. Not called for the first connection.
   */
  onReconnect(handler: () => void): () => void {
    this.reconnectHandlers.add(handler);
    return () => this.reconnectHandlers.delete(handler);
  }

  private open(): void {
    const socket = new WebSocket(this.wsURL);
    this.socket = socket;

    socket.onopen = () => {
      const reconnected = this._status() === 'reconnecting';
      this.attempt = 0;
      this._status.set('open');
      if (reconnected) for (const handler of this.reconnectHandlers) handler();
      for (const message of this.outbox.splice(0)) socket.send(JSON.stringify(message));
    };
    socket.onmessage = (event) => {
      const message = JSON.parse(String(event.data)) as ServerMessage;
      for (const handler of this.handlers) handler(message);
    };
    socket.onclose = () => {
      if (this.socket !== socket) return;
      this.socket = null;
      if (!this.wanted) return;
      this._status.set('reconnecting');
      this.scheduleRetry();
    };
  }

  private scheduleRetry(): void {
    const delay = RECONNECT_DELAYS_MS[Math.min(this.attempt, RECONNECT_DELAYS_MS.length - 1)];
    this.attempt++;
    this.retryTimer = setTimeout(() => this.retryNow(), delay);
  }

  private retryNow(): void {
    clearTimeout(this.retryTimer);
    this.retryTimer = undefined;
    if (this.wanted && !this.socket) this.open();
  }
}

/** Resolves a relative path such as `/ws` against the page, and switches `http:`/`https:` to `ws:`/`wss:`. */
function toSocketUrl(path: string, base: string): string {
  const url = new URL(path, base);
  url.protocol = url.protocol.replace(/^http/, 'ws');
  return url.href;
}
