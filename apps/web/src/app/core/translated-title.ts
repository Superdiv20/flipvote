import { inject, Injectable, type Provider } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { type RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import type { Subscription } from 'rxjs';

@Injectable()
class TranslatedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly transloco = inject(TranslocoService);
  private subscription?: Subscription;

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const key = this.buildTitle(snapshot) ?? DEFAULT_TITLE_KEY;
    this.subscription?.unsubscribe();
    this.subscription = this.transloco
      .selectTranslate(key)
      .subscribe((text: string) => this.title.setTitle(text));
  }
}

const DEFAULT_TITLE_KEY = marker('app.title');

/** Route titles are translation keys; the tab title follows the language as it changes. */
export function provideTranslatedTitles(): Provider {
  return { provide: TitleStrategy, useClass: TranslatedTitleStrategy };
}
