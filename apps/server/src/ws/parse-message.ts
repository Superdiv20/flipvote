import { type ClientMessage, type IssueInput } from '@flipvote/protocol';
import { isObject } from '../shared/is-object';
import { isDeckId } from '../shared/is-deck-id';

/**
 * Turns a raw frame into a `ClientMessage`, or `null` when it isn't one. Every field is checked,
 * and the result is built from the checked values only, so unknown fields never get through.
 * Content rules (a blank name, an unknown room, a card not in the deck) are left to the room
 * rules, which have better error codes for them.
 */
export function parseMessage(raw: string | Buffer): ClientMessage | null {
	let data: unknown;
	try {
		data = JSON.parse(String(raw));
	} catch {
		return null;
	}
	if (!isObject(data)) return null;

	switch (data.type) {
		case 'join': {
			const { roomId, name, sessionToken } = data;
			if (
				!isNonEmptyString(roomId) ||
				typeof name !== 'string' ||
				!isNonEmptyString(sessionToken)
			) {
				return null;
			}
			return { type: 'join', roomId, name, sessionToken };
		}
		case 'vote': {
			const { value } = data;
			if (value !== null && !isNonEmptyString(value)) return null;
			return { type: 'vote', value };
		}
		case 'flip':
			return { type: 'flip' };
		case 'reset':
			return { type: 'reset' };
		case 'setDeck': {
			const { deckId } = data;
			if (!isDeckId(deckId)) return null;
			return { type: 'setDeck', deckId };
		}
		case 'addIssue': {
			const issue = parseIssueFields(data.issue);
			// A blank title is the rule's call (`TITLE_REQUIRED`); a missing one isn't an issue at all.
			if (!issue || issue.title === undefined) return null;
			return { type: 'addIssue', issue: { ...issue, title: issue.title } };
		}
		case 'updateIssue': {
			const { issueId } = data;
			const changes = parseIssueFields(data.changes);
			if (!isNonEmptyString(issueId) || !changes) return null;
			return { type: 'updateIssue', issueId, changes };
		}
		case 'selectIssue':
		case 'removeIssue': {
			const { issueId } = data;
			if (!isNonEmptyString(issueId)) return null;
			return { type: data.type, issueId };
		}
		case 'setSpectator': {
			const { spectator } = data;
			if (typeof spectator !== 'boolean') return null;
			return { type: 'setSpectator', spectator };
		}
		case 'transferFacilitator': {
			const { participantId } = data;
			if (!isNonEmptyString(participantId)) return null;
			return { type: 'transferFacilitator', participantId };
		}
		case 'setAutoFlip': {
			const { enabled } = data;
			if (typeof enabled !== 'boolean') return null;
			return { type: 'setAutoFlip', enabled };
		}
		case 'setName': {
			// A blank or too long name is the rule's call (`NAME_REQUIRED`, `NAME_TOO_LONG`).
			const { name } = data;
			if (typeof name !== 'string') return null;
			return { type: 'setName', name };
		}
		default:
			return null;
	}
}

const ISSUE_FIELDS = ['key', 'title', 'link', 'description'] as const;

/**
 * The issue fields that are present, each a string, and nothing else. `null` when the value isn't
 * an object or a present field isn't a string. The estimate is not among them: clients can't set it.
 */
function parseIssueFields(value: unknown): Partial<IssueInput> | null {
	if (!isObject(value)) return null;
	const fields: Partial<IssueInput> = {};
	for (const name of ISSUE_FIELDS) {
		const field = value[name];
		if (field === undefined) continue;
		if (typeof field !== 'string') return null;
		fields[name] = field;
	}
	return fields;
}

function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.length > 0;
}
