import { Service, signal } from '@angular/core';

export interface Account {
  name: string;
  email: string;
}

// Mock account until sign-in is wired up to the server.
const MOCK_ACCOUNT: Account = { name: 'Jonas Keller', email: 'jonas@superdiv.de' };

/** The signed-in account, or `null` for a guest. */
@Service()
export class AccountService {
  readonly account = signal<Account | null>(MOCK_ACCOUNT);

  signIn(): void {
    this.account.set(MOCK_ACCOUNT);
  }

  signOut(): void {
    this.account.set(null);
  }
}
