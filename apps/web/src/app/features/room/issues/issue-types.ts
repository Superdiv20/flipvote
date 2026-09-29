import type { Issue } from '@flipvote/protocol';

/** The fields the issue dialog edits. */
export type IssueDetails = Pick<Issue, 'title' | 'link' | 'description'>;

export type IssueStatus = 'done' | 'current' | 'upcoming';

export function issueStatus(issue: Issue, currentId: string | null): IssueStatus {
  if (issue.id === currentId) return 'current';
  return issue.estimate === undefined ? 'upcoming' : 'done';
}

export function issueLabel(issue: Issue): string {
  return issue.key ? `${issue.key} ${issue.title}` : issue.title;
}

const KEYED_LINE = /^([A-Z][A-Z0-9]*-\d+)[\s:·-]+(.+)$/;

/** Splits a leading tracker key off a title (`ATL-12 Title`). Returns `null` for a blank title. */
export function parseIssueTitle(text: string): Pick<Issue, 'key' | 'title'> | null {
  const line = text.trim();
  if (!line) return null;
  const match = KEYED_LINE.exec(line);
  return match ? { key: match[1], title: match[2].trim() } : { title: line };
}
