import { describe, expect, test } from 'bun:test';
import type { Issue } from '@flipvote/protocol';
import { nextOpenIssue } from './next-open-issue';

const issue = (id: string, estimate?: string): Issue => (estimate ? { id, title: id, estimate } : { id, title: id });

describe('nextOpenIssue', () => {
	test('returns the next issue without an estimate', () => {
		expect(nextOpenIssue([issue('a'), issue('b', '5'), issue('c')], 'a')).toBe('c');
	});

	test('wraps around to the start', () => {
		expect(nextOpenIssue([issue('a'), issue('b'), issue('c', '5')], 'b')).toBe('a');
	});

	test('never returns the issue it starts from', () => {
		expect(nextOpenIssue([issue('a'), issue('b', '5')], 'a')).toBeNull();
	});

	test('returns null when every other issue has an estimate', () => {
		expect(nextOpenIssue([issue('a', '3'), issue('b', '5')], 'a')).toBeNull();
	});
});
