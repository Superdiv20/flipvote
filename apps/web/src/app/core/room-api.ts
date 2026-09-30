import { Service } from '@angular/core';
import { type Deck } from '@flipvote/protocol';

export class RoomApiError extends Error {
  constructor(readonly status: number) {
    super(`Request failed with status ${status}`);
  }
}

@Service()
export class RoomApiService {
  private url: string = 'http://localhost:3000/api/room';

  async createRoom(name: string, deck: Deck, sessionToken: string): Promise<string> {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ name, deck }),
    });
    if (!response.ok) throw new RoomApiError(response.status);
    return response.text();
  }
}
