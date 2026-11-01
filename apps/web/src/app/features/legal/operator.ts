/**
 * Who runs this instance, for the imprint and the privacy policy.
 *
 * The real details live in `operator.local.ts`, which git ignores, so they stay out of the
 * repository. `scripts/ensure-operator.ts` creates it with placeholders when it is missing, before
 * every dev server, build and test run. Edit the local file to fill in your own details;
 * self-hosters who make their instance public do the same.
 */
export interface Operator {
  name: string;
  street: string;
  city: string;
  phone: string;
  email: string;
}
