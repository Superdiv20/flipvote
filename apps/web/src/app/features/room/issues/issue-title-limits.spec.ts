import { ISSUE_LIMITS } from '@flipvote/protocol';
import { issueTitleTooLong } from './issue-title-limits';

const x = (n: number) => 'x'.repeat(n);
const key = (n: number) => `A${'B'.repeat(n - 3)}-1`; // a valid key of length n

describe('issueTitleTooLong', () => {
  it('accepts a title of exactly its limit', () => {
    expect(issueTitleTooLong(x(ISSUE_LIMITS.title))).toBeNull();
  });

  it('rejects a title over its limit, with no key in front', () => {
    expect(issueTitleTooLong(x(ISSUE_LIMITS.title + 1))?.message).toContain(
      `Titles can have at most ${ISSUE_LIMITS.title}`,
    );
  });

  it('measures the title without the key in front', () => {
    expect(issueTitleTooLong(`ATL-209 ${x(ISSUE_LIMITS.title)}`)).toBeNull();
    expect(issueTitleTooLong(`ATL-209 ${x(ISSUE_LIMITS.title + 1)}`)?.message).toContain('Titles');
  });

  it('measures the key on its own', () => {
    expect(issueTitleTooLong(`${key(ISSUE_LIMITS.key)} Export`)).toBeNull();
    expect(issueTitleTooLong(`${key(ISSUE_LIMITS.key + 1)} Export`)?.message).toContain(
      `Keys can have at most ${ISSUE_LIMITS.key}`,
    );
  });

  it('ignores a blank line, which is required’s business', () => {
    expect(issueTitleTooLong('   ')).toBeNull();
  });
});
