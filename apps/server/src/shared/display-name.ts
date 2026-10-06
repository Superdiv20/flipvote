import { type ErrorCode, NAME_MAX_LENGTH } from '@flipvote/protocol';

/** The trimmed display name, or why it can't be used. Shared by `join` and `setName`. */
export function displayName(name: string): { ok: true; name: string } | { ok: false; code: ErrorCode } {
	const trimmed = name.trim();
	if (!trimmed) return { ok: false, code: 'NAME_REQUIRED' };
	if (trimmed.length > NAME_MAX_LENGTH) return { ok: false, code: 'NAME_TOO_LONG' };
	return { ok: true, name: trimmed };
}
