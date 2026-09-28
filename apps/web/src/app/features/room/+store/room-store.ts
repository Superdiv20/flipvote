import { computed, Service, signal } from '@angular/core';
import type { RoomState } from '@flipvote/protocol';
import { FIBONACCI_DECK } from '../deck-types';
import { summarizeVotes } from '../results';
import { MOCK_ROOM, SELF_ID } from '../../../shared/mock-room';

const MOCK_VOTES: Record<string, string> = { maya: '5', priya: '8', leo: '5' };

@Service({ autoProvided: false })
export class RoomStore {
  readonly selfId = SELF_ID;
  readonly deck = FIBONACCI_DECK;
  readonly roomName = signal('Atlas · Sprint 42 planning');
  readonly topic = signal('ATL-214 Bulk export for invoices');

  private readonly room = signal<RoomState>(MOCK_ROOM);
  readonly myVote = signal<string | null>(null);

  readonly participants = computed(() => this.room().participants);
  readonly flipped = computed(() => this.room().flipped);
  readonly votedCount = computed(() => this.participants().filter((p) => p.hasVoted).length);
  readonly results = computed(() => {
    if (!this.flipped()) return null;
    const votes = this.participants().flatMap((p) => (p.vote === undefined ? [] : [p.vote]));
    return summarizeVotes(votes, this.deck);
  });

  /** Picks a card, or withdraws the vote when the same card is picked again. */
  vote(value: string): void {
    if (this.flipped()) return;
    const next = this.myVote() === value ? null : value;
    this.myVote.set(next);
    this.room.update((room) => ({
      ...room,
      participants: room.participants.map((p) =>
        p.id === this.selfId ? { ...p, hasVoted: next !== null } : p,
      ),
    }));
  }

  flip(): void {
    const myVote = this.myVote() ?? undefined;
    this.room.update((room) => ({
      ...room,
      flipped: true,
      participants: room.participants.map((p) => ({
        ...p,
        vote: p.id === this.selfId ? myVote : p.hasVoted ? MOCK_VOTES[p.id] : undefined,
      })),
    }));
  }

  reset(): void {
    this.myVote.set(null);
    this.room.update((room) => ({
      ...room,
      flipped: false,
      participants: room.participants.map(({ id, name }) => ({ id, name, hasVoted: false })),
    }));
  }
}
