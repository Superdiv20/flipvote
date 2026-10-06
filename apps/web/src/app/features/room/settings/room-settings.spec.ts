import { TestBed } from '@angular/core/testing';
import type { DeckId, Participant } from '@flipvote/protocol';
import { RoomSettings } from './room-settings';

const seat = (id: string, connected = true): Participant => ({
  id,
  name: id.toUpperCase(),
  isSpectator: false,
  connected,
  hasVoted: false,
});

async function open(
  inputs: { votedCount?: number; flipped?: boolean; participants?: Participant[] } = {},
) {
  const fixture = TestBed.createComponent(RoomSettings);
  fixture.componentRef.setInput('deckId', 'fibonacci');
  fixture.componentRef.setInput(
    'participants',
    inputs.participants ?? [seat('ana'), seat('ben'), seat('cy', false)],
  );
  fixture.componentRef.setInput('selfId', 'ana');
  fixture.componentRef.setInput('votedCount', inputs.votedCount ?? 0);
  fixture.componentRef.setInput('flipped', inputs.flipped ?? false);
  fixture.componentRef.setInput('autoFlip', false);
  fixture.componentRef.setInput('onlyFacilitatorCanFlip', true);

  const decks: DeckId[] = [];
  const transfers: string[] = [];
  const autoFlips: boolean[] = [];
  const onlyFacilitator: boolean[] = [];
  fixture.componentInstance.setOnlyFacilitatorCanFlip.subscribe((enabled) =>
    onlyFacilitator.push(enabled),
  );
  fixture.componentInstance.setAutoFlip.subscribe((enabled) => autoFlips.push(enabled));
  fixture.componentInstance.setDeck.subscribe((deckId) => decks.push(deckId));
  fixture.componentInstance.transferFacilitator.subscribe((id) => transfers.push(id));

  await fixture.whenStable();
  (fixture.nativeElement as HTMLElement)
    .querySelector<HTMLButtonElement>('button[aria-label="Room settings"]')!
    .click();
  await fixture.whenStable();

  // The sheet renders in an overlay outside the component.
  const sheet = () => document.querySelector('hlm-sheet-content') as HTMLElement;
  const radio = (deckId: DeckId) =>
    sheet().querySelector<HTMLInputElement>(`input[value="${deckId}"]`)!;
  const button = (text: string) =>
    [...sheet().querySelectorAll('button')].find((b) =>
      b.textContent?.includes(text),
    ) as HTMLButtonElement;
  return { fixture, sheet, radio, button, decks, transfers, autoFlips, onlyFacilitator };
}

describe('RoomSettings', () => {
  afterEach(() =>
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => (el.innerHTML = '')),
  );

  it('opens a sheet with a title and every deck, the current one picked', async () => {
    const { sheet, radio } = await open();
    expect(sheet().querySelector('h2')?.textContent).toContain('Room settings');
    expect(sheet().querySelectorAll('input[type="radio"]')).toHaveLength(3);
    expect(radio('fibonacci').checked).toBe(true);
  });

  describe('switching the deck', () => {
    it('switches right away while nobody has voted', async () => {
      const { fixture, sheet, radio, decks } = await open();
      radio('t-shirt').click();
      await fixture.whenStable();
      expect(decks).toEqual(['t-shirt']);
      expect(sheet().querySelector('[role="alert"]')).toBeNull();
    });

    it('asks first when votes would be cleared', async () => {
      const { fixture, sheet, radio, decks } = await open({ votedCount: 2 });
      radio('t-shirt').click();
      await fixture.whenStable();
      expect(decks).toEqual([]);
      expect(sheet().querySelector('[role="alert"]')?.textContent).toContain('clears 2 votes');
    });

    it('switches once confirmed', async () => {
      const { fixture, radio, button, decks } = await open({ votedCount: 1 });
      radio('modified-fibonacci').click();
      await fixture.whenStable();
      button('Switch deck').click();
      await fixture.whenStable();
      expect(decks).toEqual(['modified-fibonacci']);
    });

    it('keeps the current deck when the switch is called off', async () => {
      const { fixture, sheet, radio, button, decks } = await open({ votedCount: 1 });
      radio('t-shirt').click();
      await fixture.whenStable();
      button('Keep current deck').click();
      await fixture.whenStable();
      expect(decks).toEqual([]);
      expect(sheet().querySelector('[role="alert"]')).toBeNull();
      expect(radio('fibonacci').checked).toBe(true);
      expect(radio('t-shirt').checked).toBe(false);
    });

    it('warns about the result after the flip', async () => {
      const { fixture, sheet, radio } = await open({ flipped: true });
      radio('t-shirt').click();
      await fixture.whenStable();
      expect(sheet().querySelector('[role="alert"]')?.textContent).toContain('clears its result');
    });

    it('picking the current deck does nothing', async () => {
      const { fixture, radio, decks } = await open({ votedCount: 3 });
      radio('fibonacci').click();
      await fixture.whenStable();
      expect(decks).toEqual([]);
    });
  });

  it('turns the auto flip on with its switch', async () => {
    const { fixture, sheet, autoFlips } = await open();
    sheet().querySelector<HTMLButtonElement>('#auto-flip')!.click();
    await fixture.whenStable();
    expect(autoFlips).toEqual([true]);
  });

  it('lets everyone flip once its switch is turned off', async () => {
    const { fixture, sheet, onlyFacilitator } = await open();
    const toggle = sheet().querySelector<HTMLButtonElement>('#only-facilitator-can-flip')!;
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    toggle.click();
    await fixture.whenStable();
    expect(onlyFacilitator).toEqual([false]);
  });

  describe('handing over the role', () => {
    it('lists everyone but yourself', async () => {
      const { sheet } = await open();
      const names = [...sheet().querySelectorAll('li')].map((li) => li.textContent?.trim());
      expect(names[0]).toContain('BEN');
      expect(names[1]).toContain('CY');
      expect(names.some((n) => n?.includes('ANA'))).toBe(false);
    });

    it('hands the role to a connected participant', async () => {
      const { sheet, transfers } = await open();
      sheet()
        .querySelector<HTMLButtonElement>('button[aria-label="Make BEN facilitator"]')!
        .click();
      expect(transfers).toEqual(['ben']);
    });

    it('does not offer it to someone who is away', async () => {
      const { sheet } = await open();
      const button = sheet().querySelector<HTMLButtonElement>(
        'button[aria-label="Make CY facilitator"]',
      )!;
      expect(button.disabled).toBe(true);
      expect(button.closest('li')?.textContent).toContain('away');
    });

    it('says so when nobody else is there', async () => {
      const { sheet } = await open({ participants: [seat('ana')] });
      expect(sheet().textContent).toContain('Nobody else is in the room yet');
    });
  });
});
