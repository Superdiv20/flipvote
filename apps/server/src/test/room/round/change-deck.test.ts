import { describe, expect, test } from 'bun:test';
import { DECKS, type DeckId } from '@flipvote/protocol';
import { changeDeck } from '../../../room/round/change-deck';
import { flip } from '../../../room/round/flip';
import { applyPure, seatedRoom, unwrap } from '../test-helpers';
import { vote } from '../../../room/round/vote';

describe('changeDeck', () => {
	test('switches the deck and clears the votes', () => {
		const room = unwrap(vote(seatedRoom(), 'ben', '5'));
		const next = unwrap(applyPure(room, (r) => changeDeck(r, 'ana', 't-shirt')));
		expect(next.deck).toEqual(DECKS['t-shirt']);
		expect(next.votes.size).toBe(0);
	});

	test('after a flip, goes back to voting without the old result', () => {
		const revealed = unwrap(flip(unwrap(vote(seatedRoom(), 'ana', '5')), 'ana'));
		const next = unwrap(changeDeck(revealed, 'ana', 'modified-fibonacci'));
		expect(next.phase).toBe('voting');
		expect(next.result).toBeNull();
	});

	test('keeps the votes when the deck stays the same', () => {
		const room = unwrap(vote(seatedRoom(), 'ben', '5'));
		expect(unwrap(changeDeck(room, 'ana', 'fibonacci')).votes.get('ben')).toBe('5');
	});

	test('is facilitator only and rejects unknown decks', () => {
		expect(changeDeck(seatedRoom(), 'ben', 't-shirt')).toEqual({ ok: false, code: 'NOT_FACILITATOR' });
		expect(changeDeck(seatedRoom(), 'ana', 'tarot' as DeckId)).toEqual({ ok: false, code: 'INVALID_MESSAGE' });
	});
});
