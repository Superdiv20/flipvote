import { DOCUMENT, inject, Service, signal } from '@angular/core';
import type { ClientMessage, ServerMessage } from '@flipvote/protocol';
import { APP_CONFIG } from './config';

export type ConnectionStatus = 'idle' | 'connecting' | 'open' | 'closed';

type MessageHandler = (message: ServerMessage) => void;

/** One WebSocket connection to the server. Sends `ClientMessage`s and hands incoming `ServerMessage`s to its listeners. Knows nothing about rooms. */
@Service()
export class SocketService {
  private readonly wsURL = toSocketUrl(inject(APP_CONFIG).wsUrl, inject(DOCUMENT).baseURI);

  private socket: WebSocket | null = null;
  /** Messages sent before the socket opened, flushed once it does. */
  private readonly outbox: ClientMessage[] = [];
  private readonly handlers = new Set<MessageHandler>();

  private readonly _status = signal<ConnectionStatus>('idle');
  readonly status = this._status.asReadonly();

  connect(): void {
    if (this.socket) return;

    const socket = new WebSocket(this.wsURL);
    this.socket = socket;
    this._status.set('connecting');

    socket.onopen = () => {
      this._status.set('open');
      for (const message of this.outbox.splice(0)) socket.send(JSON.stringify(message));
    };
    socket.onmessage = (event) => {
      const message = JSON.parse(String(event.data)) as ServerMessage;
      for (const handler of this.handlers) handler(message);
    };
    socket.onclose = () => {
      if (this.socket === socket) this.socket = null;
      this._status.set('closed');
    };
  }

  disconnect(): void {
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
}

/** Resolves a relative path such as `/ws` against the page, and switches `http:`/`https:` to `ws:`/`wss:`. */
function toSocketUrl(path: string, base: string): string {
  const url = new URL(path, base);
  url.protocol = url.protocol.replace(/^http/, 'ws');
  return url.href;
}
