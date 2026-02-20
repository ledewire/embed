import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryStorage,
  SessionStorageAdapter,
  setTokenStorage,
  setTokenStorageAdapter,
  getTokenStorage,
} from './storageAdapter';

describe('InMemoryStorage', () => {
  let storage: InMemoryStorage;

  beforeEach(() => {
    storage = new InMemoryStorage();
  });

  it('returns null for non-existent keys', () => {
    expect(storage.getItem('missing')).toBeNull();
  });

  it('stores and retrieves values', () => {
    storage.setItem('key1', 'value1');
    expect(storage.getItem('key1')).toBe('value1');
  });

  it('overwrites existing values', () => {
    storage.setItem('key', 'value1');
    storage.setItem('key', 'value2');
    expect(storage.getItem('key')).toBe('value2');
  });

  it('removes items', () => {
    storage.setItem('key', 'value');
    storage.removeItem('key');
    expect(storage.getItem('key')).toBeNull();
  });

  it('removeItem on non-existent key does not throw', () => {
    expect(() => storage.removeItem('missing')).not.toThrow();
  });
});

describe('getTokenStorage / setTokenStorage', () => {
  beforeEach(() => {
    setTokenStorage('memory');
  });

  it('returns in-memory storage by default', () => {
    const storage = getTokenStorage();
    storage.setItem('test', 'value');
    expect(storage.getItem('test')).toBe('value');
  });

  it('persists values within same adapter instance', () => {
    const storage = getTokenStorage();
    storage.setItem('token', 'abc123');
    expect(getTokenStorage().getItem('token')).toBe('abc123');
  });
});

describe('setTokenStorageAdapter', () => {
  it('allows custom storage adapter', () => {
    const customStorage = new InMemoryStorage();
    customStorage.setItem('custom', 'data');

    setTokenStorageAdapter(customStorage);
    expect(getTokenStorage().getItem('custom')).toBe('data');

    getTokenStorage().setItem('new', 'value');
    expect(customStorage.getItem('new')).toBe('value');

    setTokenStorage('memory');
  });
});
