// Mock room until the socket is wired up. MOCK_VOTES stands in for the server,

import { RoomState } from '@flipvote/protocol';
import type { Issue } from '../features/room/issues/issue-types';

// which keeps other participants' votes hidden until the flip.
export const SELF_ID = 'jonas';

export const MOCK_ROOM: RoomState = {
  id: 'demo',
  flipped: false,
  participants: [
    { id: 'ahmed', name: 'Ahmed', hasVoted: false },
    { id: 'maya', name: 'Maya', hasVoted: true },
    { id: 'priya', name: 'Priya', hasVoted: true },
    { id: 'sofia', name: 'Sofia', hasVoted: false },
    { id: 'leo', name: 'Leo', hasVoted: true },
    { id: SELF_ID, name: 'Jonas', hasVoted: false },
  ],
};

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

export const MOCK_CURRENT_ISSUE_ID = 'atl-214';
