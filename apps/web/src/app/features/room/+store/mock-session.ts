import { type Provider, signal } from '@angular/core';
import type { ClientMessage, ServerMessage } from '@flipvote/protocol';
import { type ConnectionStatus, SocketService } from '../../../core/socket';
import { MOCK_HIDDEN_VOTES, MOCK_ROOM, SELF_ID } from '../../../shared/mock-room';
import { MockRoomServer } from './mock-room-server';

/** Stands in for `Session` in tests. `MockRoomServer` answers each message synchronously instead of a socket. */
export class MockSession implements Pick<
  SocketService,
  'status' | 'connect' | 'disconnect' | 'send' | 'onMessage'
> {
  readonly status = signal<ConnectionStatus>('open').asReadonly();
  private readonly server = new MockRoomServer(MOCK_ROOM, MOCK_HIDDEN_VOTES, SELF_ID);
  private readonly handlers = new Set<(message: ServerMessage) => void>();

  connect(): void {}

  disconnect(): void {}

  send(message: ClientMessage): void {
    for (const reply of this.server.receive(message)) this.deliver(reply);
  }

  /** Hands a server message to the listeners, for cases the mock server doesn't produce itself. */
  deliver(message: ServerMessage): void {
    for (const handler of this.handlers) handler(message);
  }

  onMessage(handler: (message: ServerMessage) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
}

export function provideMockSession(): Provider {
  return { provide: SocketService, useClass: MockSession };
}
