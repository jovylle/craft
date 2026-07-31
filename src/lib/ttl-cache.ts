interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export class TtlCache<T> {
  private store = new Map<string, CacheEntry<T>>()

  constructor(
    private ttlMs: number,
    private now: () => number = () => Date.now(),
  ) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    // Expired entries are left in place so peek() can serve them as a stale fallback.
    if (entry.expiresAt <= this.now()) return undefined
    return entry.value
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: this.now() + this.ttlMs })
  }

  /** Return a possibly-expired value without deleting it (for stale fallback). */
  peek(key: string): T | undefined {
    return this.store.get(key)?.value
  }

  clear(): void {
    this.store.clear()
  }
}
