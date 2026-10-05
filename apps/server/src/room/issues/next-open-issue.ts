import type { Issue } from '@flipvote/protocol';

/**
 * The next issue without an estimate after `afterId`, wrapping around to the start. `afterId`
 * itself never counts, so this also works for the issue that is being removed.
 */
export function nextOpenIssue(issues: Issue[], afterId: string): string | null {
	const index = issues.findIndex((issue) => issue.id === afterId);
	const open = (issue: Issue) => issue.estimate === undefined && issue.id !== afterId;
	return (issues.slice(index + 1).find(open) ?? issues.find(open))?.id ?? null;
}
