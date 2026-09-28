// Mock room until the socket is wired up. MOCK_VOTES stands in for the server,

import { RoomState } from "@flipvote/protocol";

// which keeps other participants' votes hidden until the flip.
export const SELF_ID = 'jonas';

export const MOCK_ROOM: RoomState = {
  id: 'demo',
  flipped: false,
  participants: [
    { id: 'ahmed', name: 'Ahmed', hasVoted: false },
    { id: 'may1a', name: 'Maya', hasVoted: true },
    { id: 'priya', name: 'Priya', hasVoted: true },
    { id: 'sofia', name: 'Sofia', hasVoted: false },
    { id: 'leo', name: 'Leo', hasVoted: true },
    { id: SELF_ID, name: 'Jonas', hasVoted: false },
  ],
};
