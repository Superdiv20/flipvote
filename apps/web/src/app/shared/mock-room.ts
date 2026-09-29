// Mock room until the socket is wired up, in the shape the server sends it.

import { type CardValue, DECKS, type Issue, type RoomState } from '@flipvote/protocol';

export const SELF_ID = 'jonas';

export const MOCK_ISSUES: Issue[] = [
  { id: 'atl-209', key: 'ATL-209', title: 'Invoice PDF template refresh', estimate: '5' },
  {
    id: 'atl-211',
    key: 'ATL-211',
    title: 'Retry failed webhook deliveries with exponential backoff',
    estimate: '8',
  },
  { id: 'atl-214', key: 'ATL-214', title: 'Bulk export for invoices' },
  {
    id: 'atl-217',
    key: 'ATL-217',
    title:
      'SSO login via Okta for enterprise workspaces, including SCIM user provisioning and group mapping',
  },
  { id: 'atl-220', key: 'ATL-220', title: 'Audit log filters by user and date range' },
  { id: 'atl-223', key: 'ATL-223', title: 'Rate limit the public API' },
];

/** The room as the server would send it to Jonas, who is the facilitator. */
export const MOCK_ROOM: RoomState = {
  id: 'demo',
  name: 'Atlas · Sprint 42 planning',
  deck: DECKS.fibonacci,
  phase: 'voting',
  facilitatorId: SELF_ID,
  participants: [
    { id: 'ahmed', name: 'Ahmed', isSpectator: false, connected: true, hasVoted: false },
    { id: 'maya', name: 'Maya', isSpectator: false, connected: true, hasVoted: true },
    { id: 'priya', name: 'Priya', isSpectator: false, connected: true, hasVoted: true },
    { id: 'sofia', name: 'Sofia', isSpectator: false, connected: true, hasVoted: false },
    { id: 'leo', name: 'Leo', isSpectator: false, connected: true, hasVoted: true },
    { id: SELF_ID, name: 'Jonas', isSpectator: false, connected: true, hasVoted: false },
  ],
  issues: MOCK_ISSUES,
  currentIssueId: 'atl-214',
  result: null,
  selfId: SELF_ID,
  myVote: null,
};

/** The other participants' votes, which only the server knows until the flip. */
export const MOCK_HIDDEN_VOTES: Record<string, CardValue> = { maya: '5', priya: '8', leo: '5' };
