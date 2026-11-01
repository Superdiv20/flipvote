import { Component } from '@angular/core';
import { LegalLayout } from './legal-layout';
import { OPERATOR } from './operator.local';

/** The imprint (Impressum). German only, see LegalLayout. */
@Component({
  selector: 'flipvote-imprint-page',
  imports: [LegalLayout],
  template: `
    <flipvote-legal-layout>
      <h1>Impressum</h1>

      <p>
        {{ operator.name }}<br />
        {{ operator.street }}<br />
        {{ operator.city }}
      </p>

      <h2>Kontakt</h2>
      <p>
        Telefon: {{ operator.phone }}<br />
        E-Mail: <a [href]="'mailto:' + operator.email">{{ operator.email }}</a>
      </p>

      <p>
        Quelle:
        <a href="https://www.e-recht24.de" target="_blank" rel="noopener"
          >https://www.e-recht24.de</a
        >
      </p>
    </flipvote-legal-layout>
  `,
})
export class ImprintPage {
  protected readonly operator = OPERATOR;
}
