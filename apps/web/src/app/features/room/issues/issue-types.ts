export interface Issue {
  id: string;
  /** Tracker key such as `ATL-214`, when the issue came with one. */
  key?: string;
  title: string;
  /** Set once a round on this issue has finished. */
  estimate?: string;
}

export type IssueStatus = 'done' | 'current' | 'upcoming';

export function issueStatus(issue: Issue, currentId: string | null): IssueStatus {
  if (issue.id === currentId) return 'current';
  return issue.estimate === undefined ? 'upcoming' : 'done';
}

export function issueLabel(issue: Issue): string {
  return issue.key ? `${issue.key} ${issue.title}` : issue.title;
}

const KEYED_LINE = /^([A-Z][A-Z0-9]*-\d+)[\s:·-]+(.+)$/;

/** One issue per non-empty line; a leading tracker key (`ATL-12 Title`) is split off. */
export function parseIssueLines(text: string): Omit<Issue, 'id'>[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = KEYED_LINE.exec(line);
      return match ? { key: match[1], title: match[2].trim() } : { title: line };
    });
}
