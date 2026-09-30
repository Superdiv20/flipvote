import { Deck } from '@flipvote/protocol';
import { createRoom, type Room } from './room';

const rooms = new Map<string, Room>();

function addRoom(name: string, deck: Deck): Room {
	const roomId = crypto.randomUUID();
	const room = createRoom({ id: roomId, name, deck });
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

export { addRoom, getRoom, updateRoom, removeRoom };
