import { computed, Service, signal } from '@angular/core';
import type { RoomState } from '@flipvote/protocol';
import { FIBONACCI_DECK } from '../deck-types';
import { summarizeVotes } from '../results';
import { MOCK_CURRENT_ISSUE_ID, MOCK_ISSUES, MOCK_ROOM, SELF_ID } from '../../../shared/mock-room';
import { type Issue, issueLabel, parseIssueLines } from '../issues/issue-types';

const MOCK_VOTES: Record<string, string> = { maya: '5', priya: '8', leo: '5' };

@Service({ autoProvided: false })
export class RoomStore {
  readonly selfId = SELF_ID;
  readonly deck = FIBONACCI_DECK;
  readonly roomName = signal('Atlas · Sprint 42 planning');

  readonly issues = signal<Issue[]>(MOCK_ISSUES);
  readonly currentIssueId = signal<string | null>(MOCK_CURRENT_ISSUE_ID);
  readonly currentIssue = computed(
    () => this.issues().find((issue) => issue.id === this.currentIssueId()) ?? null,
  );
  readonly topic = computed(() => {
    const issue = this.currentIssue();
    return issue ? issueLabel(issue) : null;
  });
  private nextIssueId = 0;

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

  /** Starts a new round. A finished round records its estimate and moves on to the next open issue. */
  reset(): void {
    const estimate = this.results()?.estimate;
    const current = this.currentIssueId();
    if (estimate && current) {
      this.issues.update((issues) =>
        issues.map((issue) => (issue.id === current ? { ...issue, estimate } : issue)),
      );
      this.currentIssueId.set(this.nextOpenIssue(current));
    }
    this.clearRound();
  }

  /** Switches the table to another issue and starts a fresh round on it. */
  selectIssue(id: string): void {
    if (id === this.currentIssueId()) return;
    this.currentIssueId.set(id);
    this.clearRound();
  }

  /** Adds one issue per line. The first one becomes current when nothing is being estimated. */
  addIssues(text: string): void {
    const added = parseIssueLines(text).map((issue) => ({
      ...issue,
      id: `new-${++this.nextIssueId}`,
    }));
    if (!added.length) return;
    this.issues.update((issues) => [...issues, ...added]);
    if (this.currentIssueId() === null) this.currentIssueId.set(added[0].id);
  }

  private nextOpenIssue(afterId: string): string | null {
    const issues = this.issues();
    const index = issues.findIndex((issue) => issue.id === afterId);
    const open = (issue: Issue) => issue.estimate === undefined;
    return (issues.slice(index + 1).find(open) ?? issues.find(open))?.id ?? null;
  }

  private clearRound(): void {
    this.myVote.set(null);
    this.room.update((room) => ({
      ...room,
      flipped: false,
      participants: room.participants.map(({ id, name }) => ({ id, name, hasVoted: false })),
    }));
  }
}
