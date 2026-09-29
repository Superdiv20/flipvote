import { COFFEE_CARD } from '@flipvote/protocol';

/** What a card shows: `0.5` as `½`, everything else as is. The coffee card shows an icon instead. */
export function cardText(value: string): string {
  return value === '0.5' ? '½' : value;
}

/** Accessible name of a card. */
export function cardLabel(value: string): string {
  return value === COFFEE_CARD ? 'Coffee break' : cardText(value);
}
