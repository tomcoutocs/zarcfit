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
import { toast } from 'sonner';
import { Send } from 'lucide-react';

export type InvoiceableClient = {
  id: string;
  email: string;
  name: string;
};

interface InvoiceClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: InvoiceableClient[];
  /** Pre-select this client (e.g. opened from the client detail page). */
  defaultClientId?: string;
}

/**
 * "Send invoice" dialog for the trainer-bills-client flow (PF-323).
 * Calls /api/stripe/connect/invoice, which creates + sends a Stripe
 * invoice on the trainer's connected account. No platform fee is applied.
 */
export function InvoiceClientDialog({ open, onOpenChange, clients, defaultClientId }: InvoiceClientDialogProps) {
  const [clientId, setClientId] = useState(defaultClientId || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      setClientId(defaultClientId || clients[0]?.id || '');
      setAmount('');
      setDescription('');
    }
  }, [open, defaultClientId, clients]);

  const selectedClient = clients.find((c) => c.id === clientId);

  const handleSend = async () => {
    if (!selectedClient) {
      toast.error('Choose a client to invoice');
      return;
    }
    const amountNumber = Number(amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      toast.error('Enter an amount greater than $0');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/stripe/connect/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          clientEmail: selectedClient.email,
          clientName: selectedClient.name,
          amountCents: Math.round(amountNumber * 100),
          description: description.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to send invoice');
        return;
      }
      toast.success(`Invoice sent to ${selectedClient.name}`);
      onOpenChange(false);
    } catch {
      toast.error('Failed to send invoice');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Invoice</DialogTitle>
          <DialogDescription>
            Emails a Stripe-hosted invoice the client can pay by card. No platform fee is taken.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invoice-client">Client</Label>
            <Select value={clientId} onValueChange={setClientId} disabled={clients.length <= 1}>
              <SelectTrigger id="invoice-client">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} · {client.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice-amount">Amount (USD)</Label>
            <Input
              id="invoice-amount"
              type="number"
              min="1"
              step="0.01"
              placeholder="150.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice-description">Description (optional)</Label>
            <Textarea
              id="invoice-description"
              placeholder="e.g. October training sessions"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending || !selectedClient} className="gap-2">
            <Send className="h-4 w-4" />
            {sending ? 'Sending...' : 'Send Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
