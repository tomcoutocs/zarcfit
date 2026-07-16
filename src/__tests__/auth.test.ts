import { describe, it, expect } from 'vitest';
import { pickPrimaryRole, homeForRole } from '@/lib/auth-routes';

describe('pickPrimaryRole', () => {
  it('prefers admin over trainer and client', () => {
    expect(pickPrimaryRole(['client', 'trainer', 'admin'])).toBe('admin');
  });

  it('prefers trainer over client', () => {
    expect(pickPrimaryRole(['client', 'trainer'])).toBe('trainer');
  });

  it('returns client when only client role', () => {
    expect(pickPrimaryRole(['client'])).toBe('client');
  });

  it('returns null for empty or invalid roles', () => {
    expect(pickPrimaryRole([])).toBeNull();
    expect(pickPrimaryRole(['unknown'])).toBeNull();
  });
});

describe('homeForRole', () => {
  it('routes each role to the correct dashboard', () => {
    expect(homeForRole('trainer')).toBe('/trainer/dashboard');
    expect(homeForRole('admin')).toBe('/admin');
    expect(homeForRole('client')).toBe('/client');
    expect(homeForRole(null)).toBe('/');
  });
});
