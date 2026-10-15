import { TestBed } from '@angular/core/testing';
import { LogoMark } from './logo-mark';

async function render(animated?: boolean) {
  const fixture = TestBed.createComponent(LogoMark);
  if (animated !== undefined) fixture.componentRef.setInput('animated', animated);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('LogoMark', () => {
  it('is still by default, as in the header logo', async () => {
    expect((await render()).classList.contains('animated')).toBe(false);
  });

  it('animates when asked to', async () => {
    expect((await render(true)).classList.contains('animated')).toBe(true);
  });

  it('draws the loop by its own length, so the animation can run it from 0 to 100', async () => {
    const loop = (await render(true)).querySelector('.loop');
    expect(loop?.getAttribute('pathLength')).toBe('100');
  });

  it('keeps the tilt on the group, apart from the card the flip transforms', async () => {
    const card = (await render(true)).querySelector('.card')!;
    expect(card.getAttribute('transform')).toBeNull();
    expect(card.parentElement?.getAttribute('transform')).toBe('rotate(10 14 14)');
  });

  it('is hidden from screen readers; the status text next to it speaks', async () => {
    expect((await render(true)).querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });
});
