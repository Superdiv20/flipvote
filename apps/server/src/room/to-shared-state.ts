import type { CardValue, RoomState } from '@flipvote/protocol';
import type { Room } from './room';

/**
 * The state every client in the room sees, identical for all of them, so it can be published
 * once to the room's topic. Every field is mapped explicitly, so server-only fields on `Room` or
 * `Participant` can never leak. Vote values and the result appear only once revealed.
 *
 * `flipInMs` is the auto flip's countdown, which lives outside the room, as a timer.
 */
export function toSharedState(room: Room, flipInMs: number | null = null): RoomState {
	// Only rooms with participants are ever sent, and those always have a facilitator.
	if (room.facilitatorId === null) {
		throw new Error(`Room ${room.id} has nobody in it to send its state to`);
	}
	const revealed = room.phase === 'revealed';

	return {
		id: room.id,
		name: room.name,
		deck: { id: room.deck.id, name: room.deck.name, cards: [...room.deck.cards] },
		phase: room.phase,
		facilitatorId: room.facilitatorId,
		participants: [...room.participants.values()].map((participant) => {
			const vote = room.votes.get(participant.id);
			return {
				id: participant.id,
				name: participant.name,
				isSpectator: participant.isSpectator,
				connected: participant.connected,
				hasVoted: vote !== undefined,
				...(revealed && vote !== undefined ? { vote } : {}),
			};
		}),
		issues: room.issues.map((issue) => ({
			id: issue.id,
			title: issue.title,
			...(issue.key !== undefined ? { key: issue.key } : {}),
			...(issue.link !== undefined ? { link: issue.link } : {}),
			...(issue.description !== undefined ? { description: issue.description } : {}),
			...(issue.estimate !== undefined ? { estimate: issue.estimate } : {}),
		})),
		currentIssueId: room.currentIssueId,
		result: revealed && room.result ? structuredClone(room.result) : null,
		autoFlip: room.autoFlip,
		flipInMs: revealed ? null : flipInMs,
		onlyFacilitatorCanFlip: room.onlyFacilitatorCanFlip,
	};
}

/** A participant's own vote in the current round, for `welcome` and `myVote`. Only ever sent to that participant. */
export function ownVote(room: Room, participantId: string): CardValue | null {
	return room.votes.get(participantId) ?? null;
}
