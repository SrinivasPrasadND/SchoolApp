import { describe, it, expect } from 'vitest';
import { feeStructureSchema, leaveSchema } from '@/schemas';
import { isoOffset } from '@/utils';

describe('feeStructureSchema validation', () => {
  const base = {
    name: 'Tuition',
    category: 'tuition' as const,
    amount: 1000,
    dueDate: isoOffset(10),
    academicYear: '2026-2027',
    term: 'Term 1',
    classId: 'all',
    section: 'all',
  };

  it('rejects non-positive amounts', () => {
    const result = feeStructureSchema.safeParse({ ...base, amount: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects past due dates', () => {
    const result = feeStructureSchema.safeParse({ ...base, dueDate: isoOffset(-5) });
    expect(result.success).toBe(false);
  });

  it('accepts a valid fee structure', () => {
    const result = feeStructureSchema.safeParse(base);
    expect(result.success).toBe(true);
  });
});

describe('leaveSchema validation', () => {
  it('rejects end date before start date', () => {
    const result = leaveSchema.safeParse({
      type: 'casual',
      startDate: isoOffset(5),
      endDate: isoOffset(2),
      reason: 'Family function to attend',
    });
    expect(result.success).toBe(false);
  });

  it('rejects too-short reasons', () => {
    const result = leaveSchema.safeParse({
      type: 'sick',
      startDate: isoOffset(1),
      endDate: isoOffset(2),
      reason: 'sick',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid leave request', () => {
    const result = leaveSchema.safeParse({
      type: 'sick',
      startDate: isoOffset(1),
      endDate: isoOffset(2),
      reason: 'Down with a fever, doctor advised rest.',
    });
    expect(result.success).toBe(true);
  });
});
