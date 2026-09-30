import type { Issue } from '@flipvote/protocol';
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

/** The next issue without an estimate after `afterId`, wrapping around to the start. */
function nextOpenIssue(issues: Issue[], afterId: string): string | null {
	const index = issues.findIndex((issue) => issue.id === afterId);
	const open = (issue: Issue) => issue.estimate === undefined;
	return (issues.slice(index + 1).find(open) ?? issues.find(open))?.id ?? null;
}
