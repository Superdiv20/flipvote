/**
 * Every socket of a seat (one per open tab) subscribes to this topic. Messages for that person
 * alone, such as `myVote`, go here, and it tells whether any tab of the seat is still open.
 */
export function seatTopic(roomId: string, participantId: string): string {
	return `${roomId}:${participantId}`;
}
