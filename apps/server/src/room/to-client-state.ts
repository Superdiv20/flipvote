import type { RoomState } from '@flipvote/protocol';
import type { Room } from './room';

/**
 * The state one recipient may see. Every field is mapped explicitly, so server-only fields on
 * `Room` or `Participant` can never leak. Votes of others appear only once revealed; the
 * recipient's own vote is always included as `myVote`.
 */
export function toClientState(room: Room, recipientId: string): RoomState {
	if (!room.participants.has(recipientId)) {
		throw new Error(`${recipientId} is not in room ${room.id}`);
	}
	// A room with a participant always has a facilitator.
	const facilitatorId = room.facilitatorId!;
	const revealed = room.phase === 'revealed';

	return {
		id: room.id,
		name: room.name,
		deck: { id: room.deck.id, name: room.deck.name, cards: [...room.deck.cards] },
		phase: room.phase,
		facilitatorId,
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
		selfId: recipientId,
		myVote: room.votes.get(recipientId) ?? null,
	};
}
