import { inject, Service } from '@angular/core';
import type { ApiError, CreateRoomRequest, CreateRoomResponse } from '@flipvote/protocol';
import { APP_CONFIG } from './config';

export class RoomApiError extends Error {
  constructor(
    readonly status: number,
    /** The server's error code, when it sent one. */
    readonly code?: ApiError['code'],
  ) {
    super(`Request failed with status ${status}${code ? ` (${code})` : ''}`);
  }
}

@Service()
export class RoomApiService {
  private readonly url = `${inject(APP_CONFIG).apiUrl}/rooms`;

  /** Creates an empty room owned by `sessionToken` and resolves with its id. */
  async createRoom(request: CreateRoomRequest, sessionToken: string): Promise<string> {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as ApiError | null;
      throw new RoomApiError(response.status, body?.code);
    }
    const { roomId } = (await response.json()) as CreateRoomResponse;
    return roomId;
  }
}
