import { Badge } from '@/components/ui/badge';
import type { InvoiceBillingStatus } from '@/lib/supabase/trainer-api';

const STATUS_STYLES: Record<InvoiceBillingStatus, { label: string; className: string }> = {
  paid: { label: 'Paid', className: 'bg-green-600 text-white hover:bg-green-600' },
  overdue: { label: 'Overdue', className: 'bg-red-600 text-white hover:bg-red-600' },
  unpaid: { label: 'Unpaid', className: 'bg-amber-500 text-black hover:bg-amber-500' },
  none: { label: 'No invoices', className: '' },
};

/** Roster/detail billing badge from the client's latest Connect invoice (CA-402). */
export function BillingStatusBadge({ status }: { status: InvoiceBillingStatus }) {
  const style = STATUS_STYLES[status];
  if (status === 'none') {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        {style.label}
      </Badge>
    );
  }
  return <Badge className={style.className}>{style.label}</Badge>;
}
