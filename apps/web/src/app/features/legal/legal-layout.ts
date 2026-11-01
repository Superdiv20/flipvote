import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { LanguageService } from '../../core/i18n';
import { Logo } from '../../shared/logo';

/**
 * Frame for the imprint and the privacy policy. The legal text itself is German only, so it is
 * marked `lang="de"` and other visitors get a note saying so; the frame around it is translated.
 */
@Component({
  selector: 'flipvote-legal-layout',
  imports: [RouterLink, NgIcon, HlmButtonImports, Logo, TranslocoPipe],
  providers: [provideIcons({ lucideArrowLeft })],
  host: { class: 'bg-background text-foreground flex min-h-dvh flex-col antialiased' },
  template: `
    <header class="shadow-[inset_0_-1px_0_var(--border)]">
      <div class="mx-auto flex h-16 max-w-3xl items-center justify-between gap-2 px-6">
        <a routerLink="/" [attr.aria-label]="'legal.home' | transloco"><flipvote-logo /></a>
        <a hlmBtn variant="ghost" size="lg" class="gap-2" routerLink="/">
          <ng-icon name="lucideArrowLeft" aria-hidden="true" />
          {{ 'legal.home' | transloco }}
        </a>
      </div>
    </header>

    <main class="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      @if (languageService.language() !== 'de') {
        <p class="bg-muted text-muted-foreground mb-8 rounded-lg px-4 py-3 text-sm">
          {{ 'legal.germanOnly' | transloco }}
        </p>
      }
      <article
        lang="de"
        class="text-[15px] leading-7 [&_a]:underline [&_a]:underline-offset-2 [&_h1]:mb-8 [&_h1]:text-[clamp(28px,3vw,36px)] [&_h1]:leading-tight [&_h1]:font-semibold [&_h1]:tracking-[-0.01em] [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-semibold [&_h4]:mt-4 [&_h4]:mb-1 [&_h4]:font-medium [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-4 [&_ul]:mb-4"
      >
        <ng-content />
      </article>
    </main>

    <footer class="shadow-[inset_0_1px_0_var(--border)]">
      <nav
        class="mx-auto flex max-w-3xl flex-wrap gap-1 px-4 py-4"
        [attr.aria-label]="'legal.nav' | transloco"
      >
        <a hlmBtn variant="ghost" routerLink="/imprint">{{ 'legal.imprint.link' | transloco }}</a>
        <a hlmBtn variant="ghost" routerLink="/privacy">{{ 'legal.privacy.link' | transloco }}</a>
      </nav>
    </footer>
  `,
})
export class LegalLayout {
  protected readonly languageService = inject(LanguageService);
}
