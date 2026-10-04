import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DECKS } from '@flipvote/protocol';
import { SocketService } from '../../core/socket';
import { MockSession, provideMockSession } from './+store/mock-session';
import { RoomStore } from './+store/room-store';
import { RoomPage } from './room-page';

describe('RoomPage', () => {
  function setup() {
    TestBed.configureTestingModule({
      imports: [RoomPage],
      providers: [RoomStore, provideMockSession()],
    });
    const fixture = TestBed.createComponent(RoomPage);
    fixture.componentRef.setInput('roomId', 'demo');
    const page = fixture.componentInstance as unknown as {
      drawerCollapsed: () => boolean;
      toggleDrawer: () => void;
    };
    const store = TestBed.inject(RoomStore);
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
      providers: [RoomStore, provideMockSession(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(RoomPage);
    fixture.componentRef.setInput('roomId', 'no-such-room');
    await fixture.whenStable();

    const socket = TestBed.inject(SocketService) as unknown as MockSession;
    socket.deliver({ type: 'error', code: 'ROOM_NOT_FOUND', message: 'This room does not exist or has closed.' });
    await fixture.whenStable();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('h1')?.textContent).toContain('Room not found');
    expect(page.querySelector('a[href="/"]')?.textContent).toContain('Create a new room');
    expect(page.querySelector('flipvote-poker-table')).toBeNull();
    expect(page.querySelector('flipvote-card-hand')).toBeNull();
  });
});
