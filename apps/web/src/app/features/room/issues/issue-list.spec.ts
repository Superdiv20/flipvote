import { TestBed } from '@angular/core/testing';
import type { Issue } from '@flipvote/protocol';
import { IssueList } from './issue-list';

const LONG_TITLE =
  'SSO login via Okta for enterprise workspaces, including SCIM user provisioning and group mapping';

async function renderRow() {
  const issues: Issue[] = [{ id: 'atl-217', key: 'ATL-217', title: LONG_TITLE }];
  const fixture = TestBed.createComponent(IssueList);
  fixture.componentRef.setInput('issues', issues);
  fixture.componentRef.setInput('currentId', null);
  await fixture.whenStable();
  const row = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
    'button[aria-label^="ATL-217"]',
  )!;
  return { fixture, row };
}

/** The tooltip waits a moment, so passing over the list doesn't flash one per row. */
async function afterDelay(fixture: { whenStable(): Promise<unknown> }) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  await fixture.whenStable();
}

const tooltip = () => document.querySelector('[role="tooltip"]');

describe('IssueList', () => {
  afterEach(() =>
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => (el.innerHTML = '')),
  );

  it('shows the full title in a tooltip when hovering a row with the mouse', async () => {
    const { fixture, row } = await renderRow();
    const hover = Object.assign(new Event('pointerenter'), { pointerType: 'mouse' });
    row.dispatchEvent(hover);
    await afterDelay(fixture);
    expect(tooltip()?.textContent?.trim()).toBe(LONG_TITLE);
  });

  it('shows it to keyboard users too, on focus', async () => {
    const { fixture, row } = await renderRow();
    row.dispatchEvent(new Event('focus'));
    await afterDelay(fixture);
    expect(tooltip()?.textContent?.trim()).toBe(LONG_TITLE);
  });

  it('shows nothing before the pointer reaches a row', async () => {
    const { fixture } = await renderRow();
    await afterDelay(fixture);
    expect(tooltip()).toBeNull();
  });
});
