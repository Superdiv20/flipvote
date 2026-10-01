import type { ClientMessage, ServerMessage } from '@flipvote/protocol';
import { createRoomHandler } from './http/create-room';

const server = Bun.serve({
	port: 3000,
	routes: {
		'/api/rooms': { POST: createRoomHandler },
	},
	fetch(req, server) {
		if (new URL(req.url).pathname === '/ws' && server.upgrade(req)) return;
		return new Response('Flipvote server running');
	},
	websocket: {
		open(ws) {
			console.log('client connected');
		},
		message(ws, raw) {
			const msg = JSON.parse(String(raw)) as ClientMessage;
			const reply: ServerMessage = {
				type: 'error',
				code: 'INVALID_MESSAGE',
				message: `Not implemented: ${msg.type}`,
			};
			ws.send(JSON.stringify(reply));
		},
	},
});

console.log(`Listening on ${server.url}`);
