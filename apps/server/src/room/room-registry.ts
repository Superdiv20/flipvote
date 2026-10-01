import type { Deck } from '@flipvote/protocol';
import { createRoom, type Room } from './room';

const rooms = new Map<string, Room>();

/** Creates an empty room. Nobody is seated until the creator joins over the socket. */
function addRoom(name: string, deck: Deck, creatorToken: string): Room {
	const roomId = crypto.getRandomValues(new Uint8Array(16)).join('');
	const room = createRoom({ id: roomId, name, deck, creatorToken });
	rooms.set(roomId, room);
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
	return rooms.delete(roomId);
}

export const registry = { addRoom, getRoom, updateRoom, removeRoom } as const;
