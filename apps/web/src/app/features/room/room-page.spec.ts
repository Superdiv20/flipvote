import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DECKS, ISSUE_LIMITS } from '@flipvote/protocol';
import { SessionService } from '../../core/session';
import { type ConnectionStatus, SocketService } from '../../core/socket';
import { MockSession, provideMockSession } from './+store/mock-session';
import { MOCK_ROOM } from '../../shared/mock-room';
import { RoomStore } from './+store/room-store';
import { RoomPage } from './room-page';

describe('RoomPage', () => {
  function setup() {
    TestBed.configureTestingModule({
      imports: [RoomPage],
      providers: [provideMockSession()],
    });
    const fixture = TestBed.createComponent(RoomPage);
    fixture.componentRef.setInput('roomId', 'demo');
    const page = fixture.componentInstance as unknown as {
      drawerCollapsed: () => boolean;
      toggleDrawer: () => void;
    };
    // The page provides its own store, so take that one rather than a TestBed-level copy.
    const store = fixture.debugElement.injector.get(RoomStore);
    store.join('demo', 'Jonas');
    return { store, page, fixture };
  }

  it('starts with the issue drawer collapsed', () => {
    const { page } = setup();
    expect(page.drawerCollapsed()).toBe(true);
  });

  it('collapses the opened drawer on flip and reopens it on the next round', () => {
    const { store, page } = setup();
    page.toggleDrawer();
    expect(page.drawerCollapsed()).toBe(false);
    store.vote('5');
    store.flip();
    expect(page.drawerCollapsed()).toBe(true);
    store.reset();
    expect(page.drawerCollapsed()).toBe(false);
  });

  it('stays collapsed after the round when the user collapsed it by hand', () => {
    const { store, page } = setup();
    page.toggleDrawer();
    page.toggleDrawer();
    store.vote('5');
    store.flip();
    store.reset();
    expect(page.drawerCollapsed()).toBe(true);
  });

  it('records the estimate and moves to the next open issue on a new round', () => {
    const { store } = setup();
    store.vote('5');
    store.flip();
    store.reset();
    expect(store.issues().find((i) => i.id === 'atl-214')?.estimate).toBe('5');
    expect(store.currentIssueId()).toBe('atl-217');
    expect(store.topic()).toContain('ATL-217');
  });

  it('quick-adds a single issue and splits off its tracker key', () => {
    const { store } = setup();
    store.addIssue('  ATL-300 First  ');
    store.addIssue('   ');
    expect(store.issues().at(-1)).toMatchObject({ key: 'ATL-300', title: 'First' });
    expect(store.issues().filter((i) => i.title === '')).toEqual([]);
  });

  it('edits an issue from the dialog and keeps its key and estimate', () => {
    const { store } = setup();
    store.updateIssue('atl-209', {
      title: 'New title',
      link: 'https://example.com',
      description: 'Notes',
    });
    expect(store.issues().find((i) => i.id === 'atl-209')).toEqual({
      id: 'atl-209',
      key: 'ATL-209',
      title: 'New title',
      link: 'https://example.com',
      description: 'Notes',
      estimate: '5',
    });
  });

  it('creates an issue from the dialog and splits off a tracker key', () => {
    const { store } = setup();
    store.createIssue({ title: 'ATL-400 Dialog issue', description: 'Details' });
    expect(store.issues().at(-1)).toMatchObject({
      key: 'ATL-400',
      title: 'Dialog issue',
      description: 'Details',
    });
  });

  it('selects an issue when its row in the list is clicked', async () => {
    const { store, fixture } = setup();
    await fixture.whenStable();
    const row = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll('flipvote-issue-list button'),
    ].find((button) =>
      button.getAttribute('aria-label')?.startsWith('ATL-217'),
    ) as HTMLButtonElement;
    row.click();
    await fixture.whenStable();
    expect(store.currentIssueId()).toBe('atl-217');
    expect(store.topic()).toContain('ATL-217');
  });

  it('never exposes other votes before the flip, but always the own vote', () => {
    const { store } = setup();
    store.vote('3');
    expect(store.participants().every((p) => p.vote === undefined)).toBe(true);
    expect(store.myVote()).toBe('3');
    expect(store.results()).toBeNull();
    store.flip();
    expect(store.participants().find((p) => p.id === 'maya')?.vote).toBe('5');
    expect(store.results()?.voteCount).toBe(4);
  });

  it('switches to another deck from the shared list and starts a new round', () => {
    const { store } = setup();
    store.vote('5');
    TestBed.inject(SocketService).send({ type: 'setDeck', deckId: 't-shirt' });
    expect(store.deck()).toEqual(DECKS['t-shirt'].cards);
    expect(store.myVote()).toBeNull();
  });

  it('shows the not-found screen instead of the room when the server does not know it', async () => {
    TestBed.configureTestingModule({
      imports: [RoomPage],
      providers: [provideMockSession(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(RoomPage);
    fixture.componentRef.setInput('roomId', 'no-such-room');
    // The server answers a join for an unknown room with this error instead of a state. The mock
    // server answers every join, so deliver it before the page joins.
    const socket = TestBed.inject(SocketService) as unknown as MockSession;
    socket.deliver({
      type: 'error',
      code: 'ROOM_NOT_FOUND',
      message: 'This room does not exist or has closed.',
    });
    await fixture.whenStable();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('h1')?.textContent).toContain('Room not found');
    expect(page.querySelector('a[href="/"]')?.textContent).toContain('Create a new room');
    expect(page.querySelector('flipvote-poker-table')).toBeNull();
    expect(page.querySelector('flipvote-card-hand')).toBeNull();
  });

  it('marks the participants button as live while the socket is open', async () => {
    const { fixture } = setup();
    await fixture.whenStable();
    const button = (fixture.nativeElement as HTMLElement).querySelector(
      'flipvote-room-header button[aria-label*="participants"]',
    );
    expect(button?.getAttribute('aria-label')).toBe('6 participants, connected, show list');
  });

  describe('before the room arrives', () => {
    /** A socket that never answers, so the page stays between join and the first state. */
    function silentSocket(status: ConnectionStatus) {
      return {
        status: signal(status).asReadonly(),
        connect() {},
        disconnect() {},
        send() {},
        onMessage: () => () => {},
        onReconnect: () => () => {},
      };
    }

    function render(status: ConnectionStatus) {
      TestBed.configureTestingModule({
        imports: [RoomPage],
        providers: [{ provide: SocketService, useValue: silentSocket(status) }],
      });
      TestBed.inject(SessionService).setName('Ana');
      const fixture = TestBed.createComponent(RoomPage);
      fixture.componentRef.setInput('roomId', 'room-1');
      return fixture;
    }

    it('shows that it is joining instead of an empty room', async () => {
      const fixture = render('open');
      await fixture.whenStable();
      const page = fixture.nativeElement as HTMLElement;
      expect(page.querySelector('[role="status"]')?.textContent).toContain('Joining the room');
      expect(page.querySelector('flipvote-poker-table')).toBeNull();
    });

    it('says it is trying again while the connection reconnects', async () => {
      const fixture = render('reconnecting');
      await fixture.whenStable();
      const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
      expect(alert?.textContent).toContain('Trying again in a moment');
    });

    it('offers to try again when the server cannot be reached', async () => {
      const fixture = render('closed');
      await fixture.whenStable();
      const page = fixture.nativeElement as HTMLElement;
      expect(page.querySelector('[role="alert"] h1')?.textContent).toContain('reach the server');
      expect(page.querySelector('button')?.textContent).toContain('Try again');
    });
  });

  describe('a visitor without a saved name', () => {
    function render() {
      localStorage.clear();
      TestBed.configureTestingModule({
        imports: [RoomPage],
        providers: [provideMockSession()],
      });
      const fixture = TestBed.createComponent(RoomPage);
      fixture.componentRef.setInput('roomId', 'demo');
      return fixture;
    }

    it('is asked for a name before anything is sent', async () => {
      const fixture = render();
      await fixture.whenStable();
      const page = fixture.nativeElement as HTMLElement;
      expect(page.querySelector('h1')?.textContent).toContain('Join the planning session');
      expect(page.querySelector('flipvote-poker-table')).toBeNull();
    });

    it('joins with the entered name and then sees the room', async () => {
      const fixture = render();
      await fixture.whenStable();
      const page = fixture.nativeElement as HTMLElement;

      const input = page.querySelector<HTMLInputElement>('#display-name')!;
      input.value = '  Cy  ';
      input.dispatchEvent(new Event('input'));
      page.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
      await fixture.whenStable();

      expect(TestBed.inject(SessionService).name()).toBe('Cy');
      expect(page.querySelector('flipvote-poker-table')).not.toBeNull();
    });

    it('does not join with a name over the maximum length', async () => {
      const fixture = render();
      await fixture.whenStable();
      const page = fixture.nativeElement as HTMLElement;

      const input = page.querySelector<HTMLInputElement>('#display-name')!;
      input.value = 'x'.repeat(41);
      input.dispatchEvent(new Event('input'));
      page.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
      await fixture.whenStable();

      expect(TestBed.inject(SessionService).name()).toBeNull();
      expect(page.querySelector('#display-name-error')?.textContent).toContain('under 41');
    });

    it('does not join with a blank name', async () => {
      const fixture = render();
      await fixture.whenStable();
      const page = fixture.nativeElement as HTMLElement;

      const input = page.querySelector<HTMLInputElement>('#display-name')!;
      input.value = '   ';
      input.dispatchEvent(new Event('input'));
      page.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
      await fixture.whenStable();

      expect(TestBed.inject(SessionService).name()).toBeNull();
      expect(page.querySelector('#display-name-error')?.textContent).toContain('Enter the name');
    });
  });

  it('explains a failed join and offers a way out', async () => {
    TestBed.configureTestingModule({
      imports: [RoomPage],
      providers: [provideMockSession(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(RoomPage);
    fixture.componentRef.setInput('roomId', 'demo');
    TestBed.inject(SessionService).setName('Ana');
    const socket = TestBed.inject(SocketService) as unknown as MockSession;
    // The mock server answers every join, so deliver the error before the page joins.
    socket.deliver({
      type: 'error',
      code: 'INVALID_SESSION',
      message: 'Your session could not be verified.',
    });
    await fixture.whenStable();

    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.querySelector('h1')?.textContent).toContain('Couldn’t join the room');
    expect(alert?.textContent).toContain('Your session doesn’t match your seat');
    expect(alert?.querySelector('a[href="/"]')?.textContent).toContain('Back to start');
  });

  describe('room settings', () => {
    const settingsButton = (page: HTMLElement) =>
      page.querySelector('flipvote-room-header button[aria-label="Room settings"]');

    it('are there for the facilitator and gone once the role is handed over', async () => {
      const { store, fixture } = setup();
      await fixture.whenStable();
      const page = fixture.nativeElement as HTMLElement;
      expect(settingsButton(page)).not.toBeNull();

      store.transferFacilitator('maya');
      await fixture.whenStable();

      expect(store.facilitatorId()).toBe('maya');
      expect(settingsButton(page)).toBeNull();
    });

    it('watch only drops the own vote and locks the hand', async () => {
      const { store, fixture } = setup();
      store.vote('5');
      await fixture.whenStable();

      store.setSpectator(true);
      await fixture.whenStable();

      expect(store.isSpectator()).toBe(true);
      expect(store.myVote()).toBeNull();
      const cards = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
        'flipvote-card-hand button',
      );
      expect([...cards].every((card) => card.disabled)).toBe(true);
    });
  });

  describe('auto flip countdown', () => {
    async function counting() {
      const { store, fixture } = setup();
      await fixture.whenStable();
      const socket = TestBed.inject(SocketService) as unknown as MockSession;
      socket.deliver({
        type: 'state',
        room: { ...MOCK_ROOM, autoFlip: true, flipInMs: 2500 },
      });
      await fixture.whenStable();
      return { store, page: fixture.nativeElement as HTMLElement };
    }

    it('counts down on the table instead of the vote count', async () => {
      const { page } = await counting();
      const table = page.querySelector('flipvote-poker-table')!;
      expect(table.textContent).toContain('Revealing in 3');
      expect(table.querySelector('[role="status"]')?.textContent).toContain('Everyone has voted');
    });

    it('locks the card hand', async () => {
      const { page } = await counting();
      const cards = page.querySelectorAll<HTMLButtonElement>('flipvote-card-hand button');
      expect([...cards].every((card) => card.disabled)).toBe(true);
    });
  });

  describe('the reveal button', () => {
    async function asParticipant(onlyFacilitatorCanFlip: boolean) {
      const { fixture } = setup();
      await fixture.whenStable();
      // Jonas, the one viewing, is no longer the facilitator.
      (TestBed.inject(SocketService) as unknown as MockSession).deliver({
        type: 'state',
        room: { ...MOCK_ROOM, facilitatorId: 'maya', onlyFacilitatorCanFlip },
      });
      await fixture.whenStable();
      const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll(
        'flipvote-poker-table button',
      );
      return [...buttons].some((b) => b.textContent?.includes('Reveal cards'));
    }

    it('is there for the facilitator', async () => {
      const { fixture } = setup();
      await fixture.whenStable();
      const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll(
        'flipvote-poker-table button',
      );
      expect([...buttons].some((b) => b.textContent?.includes('Reveal cards'))).toBe(true);
    });

    it('is hidden from everyone else while only the facilitator may flip', async () => {
      expect(await asParticipant(true)).toBe(false);
    });

    it('is there for everyone once the room lets everyone flip', async () => {
      expect(await asParticipant(false)).toBe(true);
    });
  });

  describe('after the flip', () => {
    async function revealed(facilitatorId: string, onlyFacilitatorCanFlip = true) {
      const { fixture } = setup();
      await fixture.whenStable();
      (TestBed.inject(SocketService) as unknown as MockSession).deliver({
        type: 'state',
        room: { ...MOCK_ROOM, phase: 'revealed', facilitatorId, onlyFacilitatorCanFlip },
      });
      await fixture.whenStable();
      const table = (fixture.nativeElement as HTMLElement).querySelector('flipvote-poker-table')!;
      const hasNewRound = [...table.querySelectorAll('button')].some((b) =>
        b.textContent?.includes('New round'),
      );
      return { table, hasNewRound };
    }

    it('shows the facilitator the new round button', async () => {
      const { table, hasNewRound } = await revealed('jonas');
      expect(hasNewRound).toBe(true);
      expect(table.querySelector('[role="status"]')?.textContent).toContain('Cards revealed');
    });

    it('tells everyone else the cards are revealed, without the button', async () => {
      const { table, hasNewRound } = await revealed('maya');
      expect(hasNewRound).toBe(false);
      expect(table.querySelector('[role="status"]')?.textContent).toContain('Cards revealed');
      expect(table.textContent).not.toContain('voted');
    });

    it('keeps the new round with the facilitator even when everyone may flip', async () => {
      const { hasNewRound } = await revealed('maya', false);
      expect(hasNewRound).toBe(false);
    });
  });

  describe('removing issues', () => {
    const trashButtons = (page: HTMLElement) =>
      [...page.querySelectorAll<HTMLButtonElement>('flipvote-issue-list button')].filter((b) =>
        b.getAttribute('aria-label')?.startsWith('Delete '),
      );

    it('the facilitator removes an issue with its delete button', async () => {
      const { store, fixture } = setup();
      await fixture.whenStable();
      const page = fixture.nativeElement as HTMLElement;
      const button = trashButtons(page).find((b) =>
        b.getAttribute('aria-label')?.startsWith('Delete ATL-220'),
      )!;
      button.click();
      await fixture.whenStable();
      expect(store.issues().some((issue) => issue.id === 'atl-220')).toBe(false);
    });

    it('removing the current issue moves on to the next open one and clears the votes', async () => {
      const { store, fixture } = setup();
      store.vote('5');
      await fixture.whenStable();
      store.removeIssue('atl-214');
      expect(store.currentIssueId()).toBe('atl-217');
      expect(store.myVote()).toBeNull();
    });

    it('everyone else sees no delete buttons', async () => {
      const { fixture } = setup();
      await fixture.whenStable();
      (TestBed.inject(SocketService) as unknown as MockSession).deliver({
        type: 'state',
        room: { ...MOCK_ROOM, facilitatorId: 'maya' },
      });
      await fixture.whenStable();
      expect(trashButtons(fixture.nativeElement as HTMLElement)).toEqual([]);
    });
  });

  describe('quick add limits', () => {
    const limit = ISSUE_LIMITS.title;

    async function typeAndPressEnter(text: string) {
      const { store, fixture } = setup();
      await fixture.whenStable();
      const page = fixture.nativeElement as HTMLElement;
      const input = page.querySelector<HTMLInputElement>('#add-issue')!;
      input.value = text;
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      await fixture.whenStable();
      return { store, page, input };
    }

    it('says the title is too long, adds nothing and keeps the text', async () => {
      const text = 'x'.repeat(limit + 1);
      const { store, page, input } = await typeAndPressEnter(text);
      expect(page.querySelector('#add-issue-error')?.textContent).toContain(
        'Titles can have at most',
      );
      expect(store.issues().some((issue) => issue.title === text)).toBe(false);
      expect(input.value).toBe(text);
    });

    it('measures the title without its key, as the server does', async () => {
      const { store, page } = await typeAndPressEnter(`ATL-300 ${'x'.repeat(limit)}`);
      expect(page.querySelector('#add-issue-error')).toBeNull();
      expect(store.issues().at(-1)).toMatchObject({ key: 'ATL-300', title: 'x'.repeat(limit) });
    });

    it('shows the reason on the warning icon, in place of the submit button', async () => {
      const { page } = await typeAndPressEnter('x'.repeat(limit + 1));
      const icon = page.querySelector(
        'flipvote-add-issue-field ng-icon[name="lucideShieldAlert"]',
      )!;
      expect(page.querySelector('flipvote-add-issue-field button[aria-label="Submit"]')).toBeNull();

      icon.dispatchEvent(Object.assign(new Event('pointerenter'), { pointerType: 'mouse' }));
      await new Promise((resolve) => setTimeout(resolve, 500));
      expect(document.querySelector('[role="tooltip"]')?.textContent).toContain(
        'Titles can have at most',
      );
    });

    it('adds a title of exactly the limit', async () => {
      const text = 'x'.repeat(limit);
      const { store, page } = await typeAndPressEnter(text);
      expect(page.querySelector('#add-issue-error')).toBeNull();
      expect(store.issues().at(-1)?.title).toBe(text);
    });
  });
});
