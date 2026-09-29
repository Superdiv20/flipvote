/** The card that asks for a break. The deck itself comes with the room state. */
export const COFFEE = 'coffee';

export function cardLabel(value: string): string {
  return value === COFFEE ? 'Coffee break' : value;
}
