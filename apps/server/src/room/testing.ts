import { expect } from 'bun:test';
import { DECKS } from '@flipvote/protocol';
import { join } from './join';
import { createRoom, type Room, type RoomResult } from './room';

/** A room with `ana`, `ben` and `cy` joined in that order; `ana` is the facilitator. */
export function seatedRoom(ids: string[] = ['ana', 'ben', 'cy']): Room {
	let room = createRoom({ id: 'room-1', name: 'Sprint 42', deck: DECKS.fibonacci });
	for (const id of ids) room = unwrap(join(room, id, id.toUpperCase()));
	return room;
}

export function unwrap(result: RoomResult): Room {
	if (!result.ok) throw new Error(`Expected ok, got ${result.code}`);
	return result.room;
}

/** Runs `rule` and checks that it left the input room untouched. */
export function applyPure(room: Room, rule: (room: Room) => RoomResult): RoomResult {
	const before = structuredClone(room);
	const result = rule(room);
	expect(room).toEqual(before);
	return result;
}
