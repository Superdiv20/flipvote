import { ISSUE_LIMITS, type IssueInput } from '@flipvote/protocol';

/** Whether every given field fits its limit in `ISSUE_LIMITS`, measured after trimming. */
export function fitsIssueLimits(fields: Partial<IssueInput>): boolean {
	return (Object.keys(ISSUE_LIMITS) as (keyof typeof ISSUE_LIMITS)[]).every(
		(field) => (fields[field]?.trim().length ?? 0) <= ISSUE_LIMITS[field],
	);
}
