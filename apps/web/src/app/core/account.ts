import { Service, signal } from '@angular/core';

export interface Account {
  name: string;
  email: string;
}

/** The signed-in account, or `null` for a guest. Everyone starts as a guest; accounts are optional. */
@Service()
export class AccountService {
  readonly account = signal<Account | null>(null);

  /** Not available yet: accounts arrive with the SaaS phase of the roadmap. */
  signIn(): void {}

  signOut(): void {
    this.account.set(null);
  }
}
