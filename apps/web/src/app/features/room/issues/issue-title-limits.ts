import { maxLengthError, type SchemaPath, validate } from '@angular/forms/signals';
import { ISSUE_LIMITS } from '@flipvote/protocol';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { parseIssueTitle } from './issue-types';

/**
 * Why a title line is too long, or `null`. The line may start with a tracker key (`ATL-12 Title`),
 * which is split off before sending, so each part is measured against its own limit, as the server
 * measures them. `message` is a translation key, which gets the limit as `{max}`.
 */
export function issueTitleTooLong(text: string): { limit: number; message: string } | null {
  const parsed = parseIssueTitle(text);
  if (!parsed) return null;
  if ((parsed.key?.length ?? 0) > ISSUE_LIMITS.key) {
    return { limit: ISSUE_LIMITS.key, message: marker('room.issues.keyTooLong') };
  }
  if (parsed.title.length > ISSUE_LIMITS.title) {
    return { limit: ISSUE_LIMITS.title, message: marker('room.issues.titleTooLong') };
  }
  return null;
}

/** The title field's limits, for quick add and the dialog alike. */
export function issueTitleLimits(path: SchemaPath<string>): void {
  validate(path, ({ value }) => {
    const tooLong = issueTitleTooLong(value());
    return tooLong ? maxLengthError(tooLong.limit, { message: tooLong.message }) : null;
  });
}
