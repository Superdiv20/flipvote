import { describe, expect, test } from 'bun:test';
import { DECKS } from '@flipvote/protocol';
import { join } from './participants/join';
import { registry } from './room-registry';
import { unwrap } from './testing';

const addRoom = () => registry.addRoom('Sprint 42', DECKS.fibonacci, 'token-creator');

describe('registry.removeEmptyRooms', () => {
	test('removes a room nobody joined once it is older than the cutoff', () => {
		const room = addRoom();
		expect(registry.removeEmptyRooms(Date.now())).toContain(room.id);
		expect(registry.getRoom(room.id)).toBeUndefined();
	});

	test('keeps an empty room that is newer than the cutoff', () => {
		const room = addRoom();
		expect(registry.removeEmptyRooms(Date.now() - 60_000)).not.toContain(room.id);
		expect(registry.getRoom(room.id)).toBeDefined();
	});

	test('keeps an old room that has someone in it', () => {
		const room = addRoom();
		registry.updateRoom(unwrap(join(room, 'ana', 'Ana', 'token-creator')));
		expect(registry.removeEmptyRooms(Date.now())).not.toContain(room.id);
		expect(registry.getRoom(room.id)?.participants.size).toBe(1);
	});
});
