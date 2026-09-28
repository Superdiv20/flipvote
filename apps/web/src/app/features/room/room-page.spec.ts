import { TestBed } from '@angular/core/testing';
import { RoomStore } from './+store/room-store';
import { RoomPage } from './room-page';

describe('RoomPage', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [RoomPage], providers: [RoomStore] });
    const fixture = TestBed.createComponent(RoomPage);
    const page = fixture.componentInstance as unknown as {
      drawerCollapsed: () => boolean;
      toggleDrawer: () => void;
    };
    return { store: TestBed.inject(RoomStore), page };
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

  it('adds one issue per pasted line and splits off tracker keys', () => {
    const { store } = setup();
    const before = store.issues().length;
    store.addIssues('ATL-300 First\n\nSecond one\n');
    const added = store.issues().slice(before);
    expect(added.map(({ key, title }) => ({ key, title }))).toEqual([
      { key: 'ATL-300', title: 'First' },
      { key: undefined, title: 'Second one' },
    ]);
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
});
