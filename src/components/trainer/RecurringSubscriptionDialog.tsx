'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { subscriptionsApi } from '@/lib/supabase/trainer-api';
import type { InvoiceableClient } from '@/components/trainer/InvoiceClientDialog';
import { toast } from 'sonner';
import { Repeat } from 'lucide-react';

interface RecurringSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: InvoiceableClient;
  onCreated?: () => void;
}

/**
 * "Set up recurring package" dialog (CA-404) — creates a monthly/annual
 * coaching subscription on the trainer's connected Stripe account. No
 * platform fee is applied, matching one-off invoices.
 */
export function RecurringSubscriptionDialog({
  open,
  onOpenChange,
  client,
  onCreated,
}: RecurringSubscriptionDialogProps) {
  const [amount, setAmount] = useState('');
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount('');
      setInterval('month');
      setDescription('');
    }
  }, [open]);

  const handleCreate = async () => {
    const amountNumber = Number(amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      toast.error('Enter an amount greater than $0');
      return;
    }

    setSaving(true);
    const result = await subscriptionsApi.createSubscription({
      clientId: client.id,
      clientEmail: client.email,
      clientName: client.name,
      amountCents: Math.round(amountNumber * 100),
      interval,
      description: description.trim() || undefined,
    });
    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(`Recurring package started for ${client.name}`);
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Up Recurring Package</DialogTitle>
          <DialogDescription>
            Bills {client.name} automatically each {interval} on your connected Stripe account. No platform fee is
            taken.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subscription-amount">Amount (USD)</Label>
            <Input
              id="subscription-amount"
              type="number"
              min="1"
              step="0.01"
              placeholder="200.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subscription-interval">Bill every</Label>
            <Select value={interval} onValueChange={(value) => setInterval(value as 'month' | 'year')}>
              <SelectTrigger id="subscription-interval">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subscription-description">Description (optional)</Label>
            <Textarea
              id="subscription-description"
              placeholder="e.g. Monthly coaching package"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={saving} className="gap-2">
            <Repeat className="h-4 w-4" />
            {saving ? 'Starting...' : 'Start Subscription'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
