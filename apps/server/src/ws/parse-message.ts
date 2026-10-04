import type { ClientMessage } from '@flipvote/protocol';
import { isObject } from '../shared/is-object';

/**
 * Turns a raw frame into a `ClientMessage`, or `null` when it isn't one. Every field is checked,
 * and the result is built from the checked values only, so unknown fields never get through.
 * Content rules (a blank name, an unknown room) are left to the room rules, which have better
 * error codes for them.
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
			if (!isNonEmptyString(roomId) || typeof name !== 'string' || !isNonEmptyString(sessionToken)) {
				return null;
			}
			return { type: 'join', roomId, name, sessionToken };
		}
		// The other message types follow as their handlers are built.
		default:
			return null;
	}
}

function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.length > 0;
}
