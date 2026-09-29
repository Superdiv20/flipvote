export const COFFEE = 'coffee';

/** Modified Fibonacci as drawn in the design; `?` means unsure, `coffee` asks for a break. */
export const FIBONACCI_DECK: readonly string[] = [
  '0',
  '1',
  '2',
  '3',
  '5',
  '8',
  '13',
  '21',
  '34',
  '55',
  '89',
  '?',
  COFFEE,
];

export function cardLabel(value: string): string {
  return value === COFFEE ? 'Coffee break' : value;
}
