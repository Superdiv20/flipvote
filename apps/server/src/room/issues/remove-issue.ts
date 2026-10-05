import { fail, newRound, ok, type Room, type RoomResult } from '../room';
import { nextOpenIssue } from './next-open-issue';

/**
 * Facilitator only. Removes an issue. When it was the current one, the votes belonged to it, so
 * the next open issue becomes current and a new round starts, as after `reset`. Removing any
 * other issue leaves the round alone.
 */
export function removeIssue(room: Room, participantId: string, issueId: string): RoomResult {
	if (!room.participants.has(participantId)) return fail('NOT_JOINED');
	if (room.facilitatorId !== participantId) return fail('NOT_FACILITATOR');
	if (!room.issues.some((issue) => issue.id === issueId)) return fail('ISSUE_NOT_FOUND');

	const issues = room.issues.filter((issue) => issue.id !== issueId);
	if (room.currentIssueId !== issueId) return ok({ ...room, issues });

	const currentIssueId = nextOpenIssue(room.issues, issueId);
	return ok(newRound({ ...room, issues, currentIssueId }));
}
