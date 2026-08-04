import { describe, it, expect } from 'vitest';
import {
  resolveInvoiceBillingStatus,
  latestInvoiceByClient,
  type TrainerClientInvoice,
} from '@/lib/supabase/trainer-api';

function makeInvoice(overrides: Partial<TrainerClientInvoice>): TrainerClientInvoice {
  return {
    id: 'inv_1',
    trainer_id: 'trainer_1',
    client_id: 'client_1',
    stripe_invoice_id: 'in_test',
    stripe_account_id: 'acct_test',
    amount_cents: 10000,
    currency: 'usd',
    status: 'open',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('CA-402 resolveInvoiceBillingStatus', () => {
  it('is "none" when there is no invoice', () => {
    expect(resolveInvoiceBillingStatus(null)).toBe('none');
    expect(resolveInvoiceBillingStatus(undefined)).toBe('none');
  });

  it('is "paid" for a paid invoice', () => {
    expect(resolveInvoiceBillingStatus(makeInvoice({ status: 'paid' }))).toBe('paid');
  });

  it('is "none" for void/uncollectible invoices', () => {
    expect(resolveInvoiceBillingStatus(makeInvoice({ status: 'void' }))).toBe('none');
    expect(resolveInvoiceBillingStatus(makeInvoice({ status: 'uncollectible' }))).toBe('none');
  });

  it('is "overdue" when open and past due_date', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    expect(resolveInvoiceBillingStatus(makeInvoice({ status: 'open', due_date: yesterday }))).toBe(
      'overdue'
    );
  });

  it('is "unpaid" when open and not yet due', () => {
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString();
    expect(resolveInvoiceBillingStatus(makeInvoice({ status: 'open', due_date: nextWeek }))).toBe(
      'unpaid'
    );
  });

  it('is "unpaid" for payment_failed without a due date', () => {
    expect(
      resolveInvoiceBillingStatus(makeInvoice({ status: 'payment_failed', due_date: null }))
    ).toBe('unpaid');
  });
});

describe('CA-402 latestInvoiceByClient', () => {
  it('picks the most recently created invoice per client', () => {
    const older = makeInvoice({
      id: 'inv_old',
      client_id: 'client_1',
      status: 'paid',
      created_at: '2026-01-01T00:00:00.000Z',
    });
    const newer = makeInvoice({
      id: 'inv_new',
      client_id: 'client_1',
      status: 'open',
      created_at: '2026-02-01T00:00:00.000Z',
    });
    const otherClient = makeInvoice({
      id: 'inv_other',
      client_id: 'client_2',
      status: 'paid',
      created_at: '2026-01-15T00:00:00.000Z',
    });

    const latest = latestInvoiceByClient([older, newer, otherClient]);

    expect(latest.get('client_1')?.id).toBe('inv_new');
    expect(latest.get('client_2')?.id).toBe('inv_other');
    expect(latest.size).toBe(2);
  });

  it('ignores invoices with no client_id', () => {
    const noClient = makeInvoice({ id: 'inv_noclient', client_id: null });
    expect(latestInvoiceByClient([noClient]).size).toBe(0);
  });
});
