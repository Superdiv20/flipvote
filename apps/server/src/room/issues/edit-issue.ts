import type { Issue, IssueInput } from '@flipvote/protocol';
import { fail, ok, type Room, type RoomResult } from '../room';
import { fitsIssueLimits } from './issue-fields';

/**
 * Anyone. Changes the given fields; a blank optional field is removed. Only the fields of
 * `IssueInput` are read, so the estimate can't be changed this way.
 */
export function editIssue(
	room: Room,
	participantId: string,
	issueId: string,
	changes: Partial<IssueInput>,
): RoomResult {
	if (!room.participants.has(participantId)) return fail('NOT_JOINED');
	const existing = room.issues.find((issue) => issue.id === issueId);
	if (!existing) return fail('ISSUE_NOT_FOUND');

	const title = changes.title === undefined ? existing.title : changes.title.trim();
	if (!title) return fail('TITLE_REQUIRED');
	if (!fitsIssueLimits(changes)) return fail('ISSUE_TOO_LONG');

	const updated: Issue = { id: existing.id, title };
	const key = pick(changes.key, existing.key);
	const link = pick(changes.link, existing.link);
	const description = pick(changes.description, existing.description);
	if (key) updated.key = key;
	if (link) updated.link = link;
	if (description) updated.description = description;
	if (existing.estimate !== undefined) updated.estimate = existing.estimate;

	return ok({ ...room, issues: room.issues.map((issue) => (issue.id === issueId ? updated : issue)) });
}

/** The changed value when one was sent, else the current one. */
function pick(change: string | undefined, current: string | undefined): string | undefined {
	return change === undefined ? current : change.trim() || undefined;
}
