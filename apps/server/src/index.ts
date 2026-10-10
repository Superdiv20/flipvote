import { parseMessage } from './ws/parse-message';
import type { SocketData } from './ws/socket-data';
import { createRoomHandler } from './http/create-room';
import { sendError } from './ws/send';
import { handleIntent } from './ws/handle-intent';
import { handleClose } from './ws/handle-close';
import { handleJoin } from './ws/handle-join';
import { createPresence } from './ws/presence';
import { createStatePublisher } from './ws/state-publisher';
import { registry } from './room/room-registry';

/** A room nobody has joined within this time is removed, e.g. when it was created and the tab closed. */
const UNJOINED_ROOM_MS = 10 * 60_000;
const SWEEP_INTERVAL_MS = 60_000;
const MAX_FRAME_BYTES = 16 * 1024;
const IDLE_TIMEOUT_SECONDS = 30;

const server = Bun.serve({
	port: 3000,
	routes: {
		'/api/rooms': { POST: createRoomHandler },
	},
	fetch(req, server) {
		if (
			new URL(req.url).pathname === '/ws' &&
			server.upgrade(req, {
				data: { roomId: null, participantId: null },
			})
		)
			return;
		return new Response('Flipvote server running');
	},
	websocket: {
		data: {} as SocketData,
		// Our largest message (an issue at its limits) stays well below this; anything bigger is not
		// ours, and Bun closes the connection.
		maxPayloadLength: MAX_FRAME_BYTES,
		// Bun pings idle sockets by itself. One that doesn't answer within this time is closed, so a
		// dropped network shows up as "away" within seconds instead of after two minutes.
		idleTimeout: IDLE_TIMEOUT_SECONDS,
		open(ws) {
			console.log('client connected');
		},
		message(ws, raw) {
			const msg = parseMessage(raw);
			if (!msg) {
				sendError(ws, 'INVALID_MESSAGE');
				return;
			}
			switch (msg.type) {
				case 'join':
					handleJoin(ws, msg, states, presence);
					break;
				default:
					handleIntent(ws, msg, server, states);
					break;
			}
		},
		close(ws) {
			handleClose(ws, server, presence);
		},
	},
});

const states = createStatePublisher(server);
const presence = createPresence(states);

setInterval(() => registry.removeEmptyRooms(Date.now() - UNJOINED_ROOM_MS), SWEEP_INTERVAL_MS);

console.log(`Listening on ${server.url}`);
