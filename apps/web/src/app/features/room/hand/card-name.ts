import { inject, Pipe, type PipeTransform } from '@angular/core';
import { COFFEE_CARD } from '@flipvote/protocol';
import { TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { cardText } from './card-label';

const COFFEE_KEY = marker('cards.coffee');

/**
 * The spoken name of a card, for labels and messages: the coffee card in the active language,
 * every other value as it is shown (`0.5` as `½`). Card values themselves are never translated.
 * Impure, so it follows a language switch together with the `transloco` pipes next to it.
 */
@Pipe({ name: 'cardName', pure: false })
export class CardNamePipe implements PipeTransform {
  private readonly transloco = inject(TranslocoService);

  transform(value: string): string {
    return value === COFFEE_CARD ? this.transloco.translate(COFFEE_KEY) : cardText(value);
  }
}
