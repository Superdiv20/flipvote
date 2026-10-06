/** A card's face value: a number like `'5'`, `'?'`, `'coffee'`, or a T-shirt size like `'M'`. */
export type CardValue = string;

export type DeckId = 'fibonacci' | 'modified-fibonacci' | 't-shirt';

export type Deck = {
	id: DeckId;
	name: string;
	/** In display order, special cards (`?`, `coffee`) included. */
	cards: CardValue[];
};

export type RoundPhase = 'voting' | 'revealed';

export type Participant = {
	id: string;
	name: string;
	isSpectator: boolean;
	/** False during the reconnect grace period, before the seat is removed. */
	connected: boolean;
	hasVoted: boolean;
	/** Only present when the phase is `revealed`. Never sent before the flip. */
	vote?: CardValue;
};

export type Issue = {
	id: string;
	/** Tracker key such as `ATL-209`. */
	key?: string;
	title: string;
	link?: string;
	description?: string;
	/** Final estimate, recorded by the server when a round on this issue finishes. */
	estimate?: CardValue;
};

/** Issue fields a client may send when adding or editing. The id and estimate belong to the server. */
export type IssueInput = Pick<Issue, 'key' | 'title' | 'link' | 'description'>;

/** Calculated by the server when the cards are revealed. */
export type RoundResult = {
	voteCount: number;
	/** Mean of the numeric votes, `null` when nobody picked a number. */
	average: number | null;
	/** Votes per value, in deck order. */
	distribution: { value: CardValue; count: number }[];
	/** The shared value when at least two people voted and all agree. */
	consensus: CardValue | null;
	/** Most common numeric vote, the higher one on a tie. Recorded on the issue at `reset`. */
	suggestedEstimate: CardValue | null;
};

/**
 * The room as every client in it sees it. It is the same for everyone, so the server publishes it
 * once to the room's topic. Personal data travels separately: the own participant id in
 * `welcome`, the own vote in `welcome` and `myVote`.
 */
export type RoomState = {
	id: string;
	name: string;
	deck: Deck;
	phase: RoundPhase;
	/** There is always exactly one facilitator. */
	facilitatorId: string;
	/** Stable join order, which drives seat placement. */
	participants: Participant[];
	issues: Issue[];
	currentIssueId: string | null;
	/** Only set when the phase is `revealed`. */
	result: RoundResult | null;
	/** The cards flip by themselves shortly after everyone who can vote has voted. */
	autoFlip: boolean;
	/**
	 * How long until the cards flip by themselves, measured when this state was sent. `null` when
	 * no countdown runs. A duration rather than a time, so a client whose clock is off still counts
	 * down correctly.
	 */
	flipInMs: number | null;
};
