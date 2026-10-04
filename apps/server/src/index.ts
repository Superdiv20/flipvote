import { parseMessage } from './ws/parse-message';
import type { SocketData } from './ws/socket-data';
import { createRoomHandler } from './http/create-room';
import { sendError } from './ws/send';
import { handleJoin } from './ws/handle-join';

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
					handleJoin(ws, msg, server);
					break;
				default:
					sendError(ws, 'INVALID_MESSAGE');
					break;
			}
		},
	},
});

console.log(`Listening on ${server.url}`);
