import { Component } from '@angular/core';
import { LogoMark } from './logo-mark';

/** The mark with the word "Flipvote" next to it. */
@Component({
  selector: 'flipvote-logo',
  imports: [LogoMark],
  host: { class: 'inline-flex items-center gap-2' },
  template: `
    <flipvote-logo-mark class="size-6" />
    <span class="text-lg font-extrabold tracking-[-0.012em]">Flipvote</span>
  `,
})
export class Logo {}
