'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  invoicesApi,
  subscriptionsApi,
  resolveInvoiceBillingStatus,
  TrainerClientInvoice,
  TrainerClientSubscription,
} from '@/lib/supabase/trainer-api';
import { BillingStatusBadge } from '@/components/trainer/BillingStatusBadge';
import { RecurringSubscriptionDialog } from '@/components/trainer/RecurringSubscriptionDialog';
import type { InvoiceableClient } from '@/components/trainer/InvoiceClientDialog';
import { toast } from 'sonner';
import { ExternalLink, RefreshCw, Ban, Repeat, XCircle } from 'lucide-react';

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: (currency || 'usd').toUpperCase(),
  }).format(cents / 100);
}

const SUBSCRIPTION_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-green-600 text-white hover:bg-green-600' },
  trialing: { label: 'Trialing', className: 'bg-blue-500 text-white hover:bg-blue-500' },
  past_due: { label: 'Past due', className: 'bg-amber-500 text-black hover:bg-amber-500' },
  incomplete: { label: 'Incomplete', className: 'bg-amber-500 text-black hover:bg-amber-500' },
  incomplete_expired: { label: 'Expired', className: '' },
  canceled: { label: 'Cancelled', className: '' },
  unpaid: { label: 'Unpaid', className: 'bg-red-600 text-white hover:bg-red-600' },
  paused: { label: 'Paused', className: '' },
};

const ACTIONABLE_INVOICE_STATUSES = new Set(['draft', 'open', 'payment_failed']);
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing', 'past_due', 'incomplete']);

type Props = {
  trainerId: string;
  clientId: string;
  connectOnboarded: boolean;
  invoiceableClient: InvoiceableClient | null;
};

/**
 * Client-detail billing section (CA-403, CA-404): invoice history with
 * resend/void actions, plus the recurring package status and cancel action.
 * Renders nothing until the trainer has connected Stripe.
 */
export function ClientBillingCard({ trainerId, clientId, connectOnboarded, invoiceableClient }: Props) {
  const [invoices, setInvoices] = useState<TrainerClientInvoice[]>([]);
  const [subscriptions, setSubscriptions] = useState<TrainerClientSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);

  const load = useCallback(async () => {
    const [invoiceData, subscriptionData] = await Promise.all([
      invoicesApi.getInvoicesForClient(trainerId, clientId),
      subscriptionsApi.getSubscriptionsForClient(trainerId, clientId),
    ]);
    setInvoices(invoiceData);
    setSubscriptions(subscriptionData);
    setLoading(false);
  }, [trainerId, clientId]);

  useEffect(() => {
    if (connectOnboarded) {
      load();
    } else {
      setLoading(false);
    }
  }, [connectOnboarded, load]);

  if (!connectOnboarded) return null;

  const activeSubscription = subscriptions.find((s) => ACTIVE_SUBSCRIPTION_STATUSES.has(s.status));

  const handleResend = async (invoiceId: string) => {
    setActioningId(invoiceId);
    const ok = await invoicesApi.resendInvoice(invoiceId);
    setActioningId(null);
    if (ok) {
      toast.success('Invoice resent');
      load();
    } else {
      toast.error('Failed to resend invoice');
    }
  };

  const handleVoid = async (invoiceId: string) => {
    if (!confirm('Void this invoice? The client will no longer be able to pay it.')) return;
    setActioningId(invoiceId);
    const ok = await invoicesApi.voidInvoice(invoiceId);
    setActioningId(null);
    if (ok) {
      toast.success('Invoice voided');
      load();
    } else {
      toast.error('Failed to void invoice');
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Cancel this recurring subscription?')) return;
    setActioningId(subscriptionId);
    const ok = await subscriptionsApi.cancelSubscription(subscriptionId);
    setActioningId(null);
    if (ok) {
      toast.success('Subscription cancelled');
      load();
    } else {
      toast.error('Failed to cancel subscription');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Billing</CardTitle>
            <CardDescription>Connect invoices and recurring packages for this client</CardDescription>
          </div>
          {invoiceableClient && !activeSubscription && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => setSubscriptionDialogOpen(true)}
            >
              <Repeat className="h-4 w-4" />
              Set up recurring package
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium">Recurring package</p>
          {activeSubscription ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
              <div>
                <p className="font-medium">
                  {formatAmount(activeSubscription.amount_cents, activeSubscription.currency)} /{' '}
                  {activeSubscription.interval}
                </p>
                {activeSubscription.description && (
                  <p className="text-muted-foreground">{activeSubscription.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge className={SUBSCRIPTION_STATUS_STYLES[activeSubscription.status]?.className}>
                  {SUBSCRIPTION_STATUS_STYLES[activeSubscription.status]?.label || activeSubscription.status}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-destructive hover:text-destructive"
                  disabled={actioningId === activeSubscription.id}
                  onClick={() => handleCancelSubscription(activeSubscription.id)}
                >
                  <XCircle className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active recurring package.</p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Invoice history</p>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices sent yet.</p>
          ) : (
            <div className="space-y-2">
              {invoices.map((invoice) => {
                const canAct = ACTIONABLE_INVOICE_STATUSES.has(invoice.status);
                return (
                  <div
                    key={invoice.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{formatAmount(invoice.amount_cents, invoice.currency)}</p>
                      <p className="text-muted-foreground">
                        {invoice.description || 'Training services'}
                        {invoice.due_date ? ` · Due ${new Date(invoice.due_date).toLocaleDateString()}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <BillingStatusBadge status={resolveInvoiceBillingStatus(invoice)} />
                      {invoice.hosted_invoice_url && (
                        <a href={invoice.hosted_invoice_url} target="_blank" rel="noreferrer">
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="View invoice">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                      {canAct && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            disabled={actioningId === invoice.id}
                            onClick={() => handleResend(invoice.id)}
                            title="Resend invoice"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            disabled={actioningId === invoice.id}
                            onClick={() => handleVoid(invoice.id)}
                            title="Void invoice"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>

      {invoiceableClient && (
        <RecurringSubscriptionDialog
          open={subscriptionDialogOpen}
          onOpenChange={setSubscriptionDialogOpen}
          client={invoiceableClient}
          onCreated={load}
        />
      )}
    </Card>
  );
}
