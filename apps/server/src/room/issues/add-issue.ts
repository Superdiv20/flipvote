import type { Issue, IssueInput } from '@flipvote/protocol';
import { fail, ok, type Room, type RoomResult } from '../room';

/**
 * Anyone. Appends an issue; it becomes current when no issue is. The caller supplies the id, so
 * this stays a pure function.
 */
export function addIssue(room: Room, participantId: string, issueId: string, input: IssueInput): RoomResult {
	if (!room.participants.has(participantId)) return fail('NOT_JOINED');
	const title = input.title.trim();
	if (!title) return fail('TITLE_REQUIRED');

	const issue: Issue = { id: issueId, title };
	const key = input.key?.trim();
	const link = input.link?.trim();
	const description = input.description?.trim();
	if (key) issue.key = key;
	if (link) issue.link = link;
	if (description) issue.description = description;

	return ok({ ...room, issues: [...room.issues, issue], currentIssueId: room.currentIssueId ?? issueId });
}
