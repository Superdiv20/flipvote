import { nextOpenIssue } from '../issues/next-open-issue';
import { fail, newRound, ok, type Room, type RoomResult } from '../room';

/**
 * Facilitator only. Starts a new round: clears votes and result. After a revealed round with a
 * suggested estimate, the estimate is recorded on the current issue and the next open issue
 * becomes current.
 */
export function reset(room: Room, participantId: string): RoomResult {
	if (!room.participants.has(participantId)) return fail('NOT_JOINED');
	if (room.facilitatorId !== participantId) return fail('NOT_FACILITATOR');

	const estimate = room.phase === 'revealed' ? room.result?.suggestedEstimate : null;
	const currentId = room.currentIssueId;
	if (!estimate || !currentId) return ok(newRound(room));

	const issues = room.issues.map((issue) => (issue.id === currentId ? { ...issue, estimate } : issue));
	return ok(newRound({ ...room, issues, currentIssueId: nextOpenIssue(issues, currentId) }));
}
