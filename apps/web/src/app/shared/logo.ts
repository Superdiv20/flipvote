import { Component, input } from '@angular/core';
import { LogoMark } from './logo-mark';

/** The mark with the word "Flipvote" next to it. `sm` is the landing footer's size. */
@Component({
  selector: 'flipvote-logo',
  imports: [LogoMark],
  host: { class: 'inline-flex items-center', '[class]': "size() === 'sm' ? 'gap-1.5' : 'gap-2'" },
  template: `
    <flipvote-logo-mark [class]="size() === 'sm' ? 'size-5' : 'size-6'" />
    <span
      class="font-extrabold tracking-[-0.012em]"
      [class]="size() === 'sm' ? 'text-base' : 'text-lg'"
      >Flipvote</span
    >
  `,
})
export class Logo {
  readonly size = input<'default' | 'sm'>('default');
}
