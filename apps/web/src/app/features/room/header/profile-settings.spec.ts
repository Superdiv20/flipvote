import { TestBed } from '@angular/core/testing';
import { ProfileSettings } from './profile-settings';

async function render(name = 'Ana') {
  const fixture = TestBed.createComponent(ProfileSettings);
  fixture.componentRef.setInput('name', name);
  const renames: string[] = [];
  fixture.componentInstance.rename.subscribe((value) => renames.push(value));
  await fixture.whenStable();

  const sheet = () => document.querySelector('hlm-sheet-content') as HTMLElement | null;
  const input = () => sheet()!.querySelector<HTMLInputElement>('#profile-name')!;
  const button = (text: string) =>
    [...sheet()!.querySelectorAll('button')].find((b) => b.textContent?.includes(text))!;

  async function open() {
    fixture.componentInstance.open();
    await fixture.whenStable();
  }
  async function type(value: string) {
    input().value = value;
    input().dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }
  async function save() {
    button('Save').click();
    await fixture.whenStable();
  }
  return { fixture, sheet, input, button, renames, open, type, save };
}

describe('ProfileSettings', () => {
  afterEach(() =>
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => (el.innerHTML = '')),
  );

  it('stays closed until it is opened', async () => {
    const { sheet } = await render();
    expect(sheet()).toBeNull();
  });

  it('opens with a title and the current name filled in', async () => {
    const { sheet, input, open } = await render('Ana');
    await open();
    expect(sheet()!.querySelector('h2')?.textContent).toContain('Profile settings');
    expect(input().value).toBe('Ana');
  });

  it('saves the trimmed new name', async () => {
    const { renames, open, type, save } = await render('Ana');
    await open();
    await type('  Ana K  ');
    await save();
    expect(renames).toEqual(['Ana K']);
  });

  it('sends nothing when the name did not change', async () => {
    const { renames, open, type, save } = await render('Ana');
    await open();
    await type(' Ana ');
    await save();
    expect(renames).toEqual([]);
  });

  it('does not save a blank name', async () => {
    const { sheet, renames, open, type, save } = await render();
    await open();
    await type('   ');
    await save();
    expect(renames).toEqual([]);
    expect(sheet()!.querySelector('#profile-name-error')?.textContent).toContain('Enter the name');
  });

  it('does not save a name that is too long', async () => {
    const { sheet, renames, open, type, save } = await render();
    await open();
    await type('x'.repeat(41));
    await save();
    expect(renames).toEqual([]);
    expect(sheet()!.querySelector('#profile-name-error')?.textContent).toContain('at most 40');
  });

  it('starts from the current name again after a cancelled edit', async () => {
    const { fixture, input, button, open, type } = await render('Ana');
    await open();
    await type('Something else');
    button('Cancel').click();
    await fixture.whenStable();

    await open();
    expect(input().value).toBe('Ana');
  });
});
