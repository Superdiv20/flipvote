export type ClientMessage =
	| { type: 'join'; roomId: string; name: string }
	| { type: 'vote'; value: string }
	| { type: 'flip' }
	| { type: 'reset' };

export type ServerMessage =
	| { type: 'state'; room: RoomState }
	| { type: 'error'; message: string };

export interface RoomState {
	id: string;
	flipped: boolean;
	participants: {
		id: string;
		name: string;
		hasVoted: boolean;
		vote?: string; // only set after flip
	}[];
}
