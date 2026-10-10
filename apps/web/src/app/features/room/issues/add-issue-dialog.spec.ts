import { DIALOG_DATA } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { ISSUE_LIMITS } from '@flipvote/protocol';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { AddIssueDialog } from './add-issue-dialog';

async function render() {
  const close = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      { provide: DIALOG_DATA, useValue: {} },
      {
        provide: BrnDialogRef,
        // Only what the dialog's parts use: closing, plus the title and description registering.
        useValue: {
          close,
          dialogId: 'dialog-1',
          registerDescription: () => {},
          unregisterDescription: () => {},
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(AddIssueDialog);
  await fixture.whenStable();
  const page = fixture.nativeElement as HTMLElement;

  async function type(id: string, value: string) {
    const field = page.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${id}`)!;
    field.value = value;
    field.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }
  async function submit() {
    page.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await fixture.whenStable();
  }
  return { page, close, type, submit };
}

describe('AddIssueDialog', () => {
  it('adds an issue within the limits', async () => {
    const { close, type, submit } = await render();
    await type('title', 'ATL-1 Export');
    await type('description', 'x'.repeat(ISSUE_LIMITS.description));
    await submit();
    expect(close).toHaveBeenCalledWith(expect.objectContaining({ title: 'ATL-1 Export' }));
  });

  it.each([
    ['title', ISSUE_LIMITS.title, 'Titles can have at most'],
    ['link', ISSUE_LIMITS.link, 'Links can have at most'],
    ['description', ISSUE_LIMITS.description, 'Descriptions can have at most'],
  ])('says the %s is too long and does not submit', async (id, limit, message) => {
    const { page, close, type, submit } = await render();
    if (id !== 'title') await type('title', 'Export');
    await type(id, 'x'.repeat(limit + 1));

    expect(page.querySelector(`#${id}-error`)?.textContent).toContain(message);
    expect(page.querySelector(`#${id}`)?.getAttribute('aria-describedby')).toContain(`${id}-error`);
    await submit();
    expect(close).not.toHaveBeenCalled();
  });

  it('lets the field run over, so the error can be read', async () => {
    const { page } = await render();
    expect(page.querySelector<HTMLInputElement>('#title')!.maxLength).toBe(-1);
  });

  it('counts the description against its limit and marks it once over', async () => {
    const { page, type } = await render();
    await type('description', 'x'.repeat(ISSUE_LIMITS.description + 1));
    const count = page.querySelector('#description-count')!;
    expect(count.textContent).toContain(
      `${ISSUE_LIMITS.description + 1}/${ISSUE_LIMITS.description}`,
    );
    expect(count.classList.contains('text-destructive')).toBe(true);
  });

  it('does not show errors before anything was typed', async () => {
    const { page } = await render();
    expect(page.querySelector('hlm-field-error')).toBeNull();
  });
});
