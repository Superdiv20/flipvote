import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { ErrorCode } from '@flipvote/protocol';
import { ERROR_MESSAGES } from '../../shared/error-messages';
import { RoomJoinFailed } from './room-join-failed';

async function reasonFor(code: ErrorCode | null): Promise<string> {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(RoomJoinFailed);
  fixture.componentRef.setInput('code', code);
  await fixture.whenStable();
  return (fixture.nativeElement as HTMLElement).querySelector('p')?.textContent?.trim() ?? '';
}

describe('RoomJoinFailed', () => {
  it('uses its own wording where the join screen has one', async () => {
    expect(await reasonFor('ALREADY_IN_ROOM')).toBe(
      'This tab is already connected to another room.',
    );
  });

  it('falls back to the shared message for any other code', async () => {
    expect(await reasonFor('NOT_JOINED')).toBe(ERROR_MESSAGES.NOT_JOINED);
  });

  it('has a sentence for a missing code', async () => {
    expect(await reasonFor(null)).toContain('Something went wrong while joining');
  });
});
