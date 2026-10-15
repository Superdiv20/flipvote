/**
 * What a card shows: `0.5` as `½`, everything else as is. The coffee card shows an icon instead;
 * its spoken name is translated (see `CardNamePipe`).
 */
export function cardText(value: string): string {
  return value === '0.5' ? '½' : value;
}
