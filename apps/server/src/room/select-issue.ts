import { fail, newRound, ok, type Room, type RoomResult } from './room';

/** Facilitator only. Makes another issue current and starts a new round on it. */
export function selectIssue(room: Room, participantId: string, issueId: string): RoomResult {
	if (!room.participants.has(participantId)) return fail('NOT_JOINED');
	if (room.facilitatorId !== participantId) return fail('NOT_FACILITATOR');
	if (!room.issues.some((issue) => issue.id === issueId)) return fail('ISSUE_NOT_FOUND');
	if (room.currentIssueId === issueId) return ok(room);

	return ok(newRound({ ...room, currentIssueId: issueId }));
}
