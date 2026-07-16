import { describe, it, expect } from 'vitest';
import { slugifyTitle } from '@/lib/blog';

describe('slugifyTitle', () => {
  it('creates URL-safe slugs', () => {
    expect(slugifyTitle('Hello World!')).toBe('hello-world');
    expect(slugifyTitle('  Protein Guide  ')).toBe('protein-guide');
  });
});

describe('rateLimit', () => {
  it('allows requests under limit', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');
    const result = rateLimit('test-key', 5, 60_000);
    expect(result.allowed).toBe(true);
  });
});
