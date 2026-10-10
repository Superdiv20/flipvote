import { TestBed } from '@angular/core/testing';
import { AccountMenu } from './account-menu';

async function openMenu() {
  const fixture = TestBed.createComponent(AccountMenu);
  fixture.componentRef.setInput('account', null);
  fixture.componentRef.setInput('guestName', 'Ana');
  fixture.componentRef.setInput('themePreference', 'system');
  await fixture.whenStable();
  (fixture.nativeElement as HTMLElement)
    .querySelector<HTMLButtonElement>('button[aria-label="Account menu"]')!
    .click();
  await fixture.whenStable();
  const items = [...document.querySelectorAll<HTMLButtonElement>('[hlmDropdownMenuItem]')];
  return (text: string) => items.find((item) => item.textContent?.includes(text))!;
}

describe('AccountMenu', () => {
  afterEach(() =>
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => (el.innerHTML = '')),
  );

  it.each(['Sign in', 'Sign up'])('marks %p as coming soon and keeps it disabled', async (text) => {
    const item = (await openMenu())(text);
    expect(item.disabled).toBe(true);
    expect(item.querySelector('[hlmBadge]')?.textContent?.trim()).toBe('Soon');
  });

  it('shows no badge on what already works', async () => {
    const item = (await openMenu())('Profile settings');
    expect(item.querySelector('[hlmBadge]')).toBeNull();
  });
});
