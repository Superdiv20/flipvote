import type { Deck } from '@flipvote/protocol';
import { createRoom, type Room } from './room';

const rooms = new Map<string, Room>();
/** When each room was created, for removing rooms nobody ever joined. */
const createdAt = new Map<string, number>();

/** Creates an empty room. Nobody is seated until the creator joins over the socket. */
function addRoom(name: string, deck: Deck, creatorToken: string): Room {
	const roomId = crypto.getRandomValues(new Uint8Array(16)).join('');
	const room = createRoom({ id: roomId, name, deck, creatorToken });
	rooms.set(roomId, room);
	createdAt.set(roomId, Date.now());
	return room;
}

function getRoom(roomId: string): Room | undefined {
	return rooms.get(roomId);
}

function updateRoom(room: Room): Room {
	rooms.set(room.id, room);
	return room;
}

function removeRoom(roomId: string): boolean {
	createdAt.delete(roomId);
	return rooms.delete(roomId);
}

/**
 * Removes rooms created at or before `cutoff` that have nobody in them, e.g. created and then
 * never joined. Rooms whose last participant left are removed right away by the presence.
 */
function removeEmptyRooms(cutoff: number): string[] {
	const removed: string[] = [];
	for (const [roomId, room] of rooms) {
		if (room.participants.size === 0 && (createdAt.get(roomId) ?? 0) <= cutoff) {
			removeRoom(roomId);
			removed.push(roomId);
		}
	}
	return removed;
}

export const registry = { addRoom, getRoom, updateRoom, removeRoom, removeEmptyRooms } as const;
