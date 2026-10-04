import {
  type CardValue,
  DECKS,
  type ClientMessage,
  type ErrorCode,
  type Issue,
  type RoomState,
  type RoundResult,
  type ServerMessage,
} from '@flipvote/protocol';

/**
 * Stands in for the server in tests. It takes the same `ClientMessage`s, keeps votes hidden until
 * the flip, and answers like the real server: the shared `state`, plus `welcome` and `myVote`
 * for the one real client, `selfId`. Everyone else is simulated.
 */
export class MockRoomServer {
  private room: Omit<RoomState, 'result'>;
  private readonly votes: Map<string, CardValue>;
  private nextIssueId = 0;

  constructor(
    initial: RoomState,
    hiddenVotes: Record<string, CardValue>,
    private readonly selfId: string,
  ) {
    const { result: _result, ...room } = initial;
    this.room = room;
    this.votes = new Map(Object.entries(hiddenVotes));
  }

  /** The shared state, the same for everyone. */
  state(): RoomState {
    const revealed = this.room.phase === 'revealed';
    return {
      ...this.room,
      participants: this.room.participants.map((p) => {
        const { vote: _vote, ...rest } = p;
        const vote = this.votes.get(p.id);
        return {
          ...rest,
          hasVoted: vote !== undefined,
          ...(revealed && vote !== undefined ? { vote } : {}),
        };
      }),
      result: revealed ? calculateResult([...this.votes.values()], this.room.deck.cards) : null,
    };
  }

  /** The replies in the order the real server sends them: personal messages first, then `state`. */
  receive(message: ClientMessage): ServerMessage[] {
    const error = this.apply(message);
    if (error) return [{ type: 'error', ...error }];

    const state: ServerMessage = { type: 'state', room: this.state() };
    const myVote = this.votes.get(this.selfId) ?? null;
    switch (message.type) {
      case 'join':
        return [{ type: 'welcome', participantId: this.selfId, myVote }, state];
      case 'vote':
        return [{ type: 'myVote', value: myVote }, state];
      default:
        return [state];
    }
  }

  private apply(message: ClientMessage): { code: ErrorCode; message: string } | null {
    const self = this.selfId;
    const isFacilitator = this.room.facilitatorId === self;
    const facilitatorOnly = {
      code: 'NOT_FACILITATOR',
      message: 'Only the facilitator can do that.',
    } as const;

    switch (message.type) {
      case 'join':
        return null;
      case 'vote': {
        if (this.participant(self)?.isSpectator) {
          return { code: 'SPECTATOR_CANNOT_VOTE', message: 'Spectators cannot vote.' };
        }
        if (this.room.phase === 'revealed') {
          return { code: 'ALREADY_REVEALED', message: 'The cards are already revealed.' };
        }
        if (message.value === null) this.votes.delete(self);
        else if (!this.room.deck.cards.includes(message.value)) {
          return { code: 'INVALID_CARD', message: `${message.value} is not in the deck.` };
        } else this.votes.set(self, message.value);
        return null;
      }
      case 'flip':
        if (!isFacilitator) return facilitatorOnly;
        if (this.votes.size === 0) return { code: 'NO_VOTES', message: 'Nobody has voted yet.' };
        this.room = { ...this.room, phase: 'revealed' };
        return null;
      case 'reset': {
        if (!isFacilitator) return facilitatorOnly;
        const estimate = this.state().result?.suggestedEstimate;
        const current = this.room.currentIssueId;
        if (estimate && current) {
          this.updateIssues((issue) => (issue.id === current ? { ...issue, estimate } : issue));
          this.room = { ...this.room, currentIssueId: this.nextOpenIssue(current) };
        }
        this.newRound();
        return null;
      }
      case 'selectIssue':
        if (!isFacilitator) return facilitatorOnly;
        if (!this.issue(message.issueId)) return issueNotFound;
        if (message.issueId === this.room.currentIssueId) return null;
        this.room = { ...this.room, currentIssueId: message.issueId };
        this.newRound();
        return null;
      case 'addIssue': {
        const issue: Issue = { ...message.issue, id: `issue-${++this.nextIssueId}` };
        this.room = {
          ...this.room,
          issues: [...this.room.issues, issue],
          currentIssueId: this.room.currentIssueId ?? issue.id,
        };
        return null;
      }
      case 'updateIssue':
        if (!this.issue(message.issueId)) return issueNotFound;
        this.updateIssues((issue) =>
          issue.id === message.issueId ? { ...issue, ...message.changes } : issue,
        );
        return null;
      case 'removeIssue':
        if (!isFacilitator) return facilitatorOnly;
        if (!this.issue(message.issueId)) return issueNotFound;
        this.room = {
          ...this.room,
          issues: this.room.issues.filter((issue) => issue.id !== message.issueId),
          currentIssueId:
            this.room.currentIssueId === message.issueId ? null : this.room.currentIssueId,
        };
        return null;
      case 'setDeck':
        if (!isFacilitator) return facilitatorOnly;
        this.room = { ...this.room, deck: DECKS[message.deckId] };
        this.newRound();
        return null;
      case 'setSpectator':
      case 'transferFacilitator':
        // No UI sends these yet.
        return { code: 'INVALID_MESSAGE', message: `${message.type} is not mocked yet.` };
    }
  }

  private participant(id: string) {
    return this.room.participants.find((p) => p.id === id);
  }

  private issue(id: string) {
    return this.room.issues.find((issue) => issue.id === id);
  }

  private updateIssues(update: (issue: Issue) => Issue): void {
    this.room = { ...this.room, issues: this.room.issues.map(update) };
  }

  private nextOpenIssue(afterId: string): string | null {
    const issues = this.room.issues;
    const index = issues.findIndex((issue) => issue.id === afterId);
    const open = (issue: Issue) => issue.estimate === undefined;
    return (issues.slice(index + 1).find(open) ?? issues.find(open))?.id ?? null;
  }

  private newRound(): void {
    this.votes.clear();
    this.room = { ...this.room, phase: 'voting' };
  }
}

const issueNotFound = { code: 'ISSUE_NOT_FOUND', message: 'That issue does not exist.' } as const;

function calculateResult(votes: CardValue[], deck: CardValue[]): RoundResult {
  const counts = new Map<CardValue, number>();
  for (const vote of votes) counts.set(vote, (counts.get(vote) ?? 0) + 1);

  const numeric = votes.map(Number).filter((n) => Number.isFinite(n));
  const average = numeric.length ? numeric.reduce((sum, n) => sum + n, 0) / numeric.length : null;

  const order = (value: CardValue) => {
    const index = deck.indexOf(value);
    return index === -1 ? deck.length : index;
  };
  const distribution = [...counts]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => order(a.value) - order(b.value));

  const consensus = votes.length >= 2 && counts.size === 1 ? votes[0] : null;

  let top: { value: CardValue; count: number } | null = null;
  for (const row of distribution) {
    if (Number.isFinite(Number(row.value)) && row.count >= (top?.count ?? 0)) top = row;
  }

  return {
    voteCount: votes.length,
    average,
    distribution,
    consensus,
    suggestedEstimate: top?.value ?? null,
  };
}
