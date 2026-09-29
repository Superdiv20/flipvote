import { computed, Service, signal } from '@angular/core';
import type { ClientMessage, RoomState, ServerMessage } from '@flipvote/protocol';
import { MOCK_HIDDEN_VOTES, MOCK_ROOM } from '../../../shared/mock-room';
import { type IssueDetails, issueLabel, parseIssueTitle } from '../issues/issue-types';
import { MockRoomServer } from './mock-room-server';

/**
 * Room state as sent by the server. Actions only send intents; the state changes when the
 * server answers. Until the socket is wired up, `MockRoomServer` answers instead.
 */
@Service({ autoProvided: false })
export class RoomStore {
  private readonly server = new MockRoomServer(MOCK_ROOM, MOCK_HIDDEN_VOTES);
  private readonly room = signal<RoomState>(this.server.state());

  readonly selfId = computed(() => this.room().selfId);
  readonly roomName = computed(() => this.room().name);
  readonly deck = computed(() => this.room().deck.cards);
  readonly participants = computed(() => this.room().participants);
  readonly flipped = computed(() => this.room().phase === 'revealed');
  readonly myVote = computed(() => this.room().myVote);
  readonly results = computed(() => this.room().result);
  readonly votedCount = computed(() => this.participants().filter((p) => p.hasVoted).length);

  readonly issues = computed(() => this.room().issues);
  readonly currentIssueId = computed(() => this.room().currentIssueId);
  readonly currentIssue = computed(
    () => this.issues().find((issue) => issue.id === this.currentIssueId()) ?? null,
  );
  readonly topic = computed(() => {
    const issue = this.currentIssue();
    return issue ? issueLabel(issue) : null;
  });

  /** Picks a card, or withdraws the vote when the same card is picked again. */
  vote(value: string): void {
    this.send({ type: 'vote', value: this.myVote() === value ? null : value });
  }

  flip(): void {
    this.send({ type: 'flip' });
  }

  /** Starts a new round. The server records the estimate and moves on to the next open issue. */
  reset(): void {
    this.send({ type: 'reset' });
  }

  selectIssue(id: string): void {
    this.send({ type: 'selectIssue', issueId: id });
  }

  /** Quick add: one issue from a single line. */
  addIssue(text: string): void {
    const parsed = parseIssueTitle(text);
    if (parsed) this.send({ type: 'addIssue', issue: parsed });
  }

  /** Adds an issue from the full dialog. A leading tracker key in the title is split off like in quick add. */
  createIssue(details: IssueDetails): void {
    const parsed = parseIssueTitle(details.title);
    if (parsed) this.send({ type: 'addIssue', issue: { ...details, ...parsed } });
  }

  updateIssue(id: string, details: IssueDetails): void {
    this.send({ type: 'updateIssue', issueId: id, changes: details });
  }

  private send(message: ClientMessage): void {
    this.handle(this.server.receive(message));
  }

  private handle(message: ServerMessage): void {
    switch (message.type) {
      case 'state':
        this.room.set(message.room);
        break;
      case 'error':
        console.warn(`[room] ${message.code}: ${message.message}`);
        break;
      case 'welcome':
        break;
    }
  }
}
