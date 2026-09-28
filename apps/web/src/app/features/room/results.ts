export interface VoteResults {
  count: number;
  /** Mean of the numeric votes, `null` when nobody picked a number. */
  average: number | null;
  /** Votes per value, in deck order. */
  distribution: { value: string; count: number }[];
  /** The shared value when at least two people voted and all agree. */
  consensus: string | null;
  /** Most common numeric vote, the higher one on a tie. `null` when nobody picked a number. */
  estimate: string | null;
}

export function summarizeVotes(votes: readonly string[], deck: readonly string[]): VoteResults {
  const counts = new Map<string, number>();
  for (const vote of votes) counts.set(vote, (counts.get(vote) ?? 0) + 1);

  const numeric = votes.map(Number).filter((n) => Number.isFinite(n));
  const average = numeric.length ? numeric.reduce((sum, n) => sum + n, 0) / numeric.length : null;

  const order = (value: string) => {
    const index = deck.indexOf(value);
    return index === -1 ? deck.length : index;
  };
  const distribution = [...counts]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => order(a.value) - order(b.value));

  const consensus = votes.length >= 2 && counts.size === 1 ? votes[0] : null;

  let estimate: { value: string; count: number } | null = null;
  for (const row of distribution) {
    if (Number.isFinite(Number(row.value)) && row.count >= (estimate?.count ?? 0)) estimate = row;
  }

  return {
    count: votes.length,
    average,
    distribution,
    consensus,
    estimate: estimate?.value ?? null,
  };
}
