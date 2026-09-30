import { TestBed } from '@angular/core/testing';
import { SessionService } from './session';

describe('SessionService', () => {
  beforeEach(() => localStorage.clear());

  function create() {
    TestBed.resetTestingModule();
    return TestBed.inject(SessionService);
  }

  it('generates a token on first use and keeps it', () => {
    const session = create();
    const token = session.token;
    expect(token).toMatch(/^[0-9a-f]{32}$/);
    expect(session.token).toBe(token);
    expect(localStorage.getItem('flipvote.sessionToken')).toBe(token);
  });

  it('reuses the stored token after a reload', () => {
    const token = create().token;
    expect(create().token).toBe(token);
  });

  it('remembers the trimmed display name and ignores blank names', () => {
    expect(create().name()).toBeNull();
    create().setName('  Maya  ');
    const session = create();
    expect(session.name()).toBe('Maya');
    session.setName('   ');
    expect(session.name()).toBe('Maya');
  });
});
