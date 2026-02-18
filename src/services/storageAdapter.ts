/**
 * Storage adapter for token persistence.
 * Default is in-memory (XSS-safe, lost on refresh). Optional sessionStorage
 * reduces long-term exposure if persistence is required.
 * Avoid localStorage for tokens in embeds (runs on third-party sites).
 */

export interface IStorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class InMemoryStorage implements IStorageAdapter {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }
}

export class SessionStorageAdapter implements IStorageAdapter {
  getItem(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // quota or security
    }
  }

  removeItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}

let adapter: IStorageAdapter = new InMemoryStorage();

export function getTokenStorage(): IStorageAdapter {
  return adapter;
}

/**
 * Configure where tokens are stored. Call before any auth (e.g. at embed init).
 * Default is in-memory. Use "session" only if you need persistence and accept
 * that sessionStorage is still readable by XSS on the host page.
 */
export function setTokenStorage(storage: "memory" | "session"): void {
  adapter =
    storage === "session" ? new SessionStorageAdapter() : new InMemoryStorage();
}

export function setTokenStorageAdapter(custom: IStorageAdapter): void {
  adapter = custom;
}
