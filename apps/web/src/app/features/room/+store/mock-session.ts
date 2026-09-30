import type { Provider } from '@angular/core';
import type { ClientMessage, ServerMessage } from '@flipvote/protocol';
import { SocketService } from '../../../core/socket';
import { MOCK_HIDDEN_VOTES, MOCK_ROOM } from '../../../shared/mock-room';
import { MockRoomServer } from './mock-room-server';

/** Stands in for `Session` in tests. `MockRoomServer` answers each message synchronously instead of a socket. */
export class MockSession implements Pick<SocketService, 'connect' | 'disconnect' | 'send' | 'onMessage'> {
  private readonly server = new MockRoomServer(MOCK_ROOM, MOCK_HIDDEN_VOTES);
  private readonly handlers = new Set<(message: ServerMessage) => void>();

  connect(): void {}

  disconnect(): void {}

  send(message: ClientMessage): void {
    const reply = this.server.receive(message);
    for (const handler of this.handlers) handler(reply);
  }

  onMessage(handler: (message: ServerMessage) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
}

export function provideMockSession(): Provider {
  return { provide: SocketService, useClass: MockSession };
}
