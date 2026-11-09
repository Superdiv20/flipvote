import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { simpleGithub } from '@ng-icons/simple-icons';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';

const GITHUB_URL = 'https://github.com/Superdiv20/flipvote';

/** Icon button to the project's repository, so every instance points back to the source. */
@Component({
  selector: 'flipvote-github-link',
  imports: [NgIcon, HlmButtonImports, HlmTooltipImports, TranslocoPipe],
  providers: [provideIcons({ simpleGithub })],
  host: { class: 'flex' },
  template: `
    <a
      hlmBtn
      variant="ghost"
      size="icon-lg"
      target="_blank"
      rel="noopener"
      [href]="url"
      [attr.aria-label]="'common.viewOnGitHub' | transloco"
      [hlmTooltip]="'common.viewOnGitHub' | transloco"
      position="bottom"
    >
      <ng-icon name="simpleGithub" aria-hidden="true" />
    </a>
  `,
})
export class GithubLink {
  protected readonly url = GITHUB_URL;
}
