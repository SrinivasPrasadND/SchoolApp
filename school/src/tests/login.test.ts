import { describe, it, expect } from 'vitest';
import { loginSchema } from '@/schemas';

describe('loginSchema validation', () => {
  it('rejects empty identifier', () => {
    const result = loginSchema.safeParse({ identifier: '', password: 'password123' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'identifier')).toBe(true);
    }
  });

  it('rejects short passwords', () => {
    const result = loginSchema.safeParse({ identifier: 'admin@school.edu', password: '123' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'password')).toBe(true);
    }
  });

  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({ identifier: 'admin@school.edu', password: 'password123' });
    expect(result.success).toBe(true);
  });
});
