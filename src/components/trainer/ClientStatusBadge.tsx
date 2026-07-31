import { Badge } from '@/components/ui/badge';

/** DB stores `terminated`; trainers read it as "Cancelled". */
const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-green-600 text-white hover:bg-green-600' },
  paused: { label: 'Paused', className: 'bg-amber-500 text-black hover:bg-amber-500' },
  terminated: { label: 'Cancelled', className: 'bg-red-600 text-white hover:bg-red-600' },
};

export function ClientStatusBadge({ status }: { status: string }) {
  if (status === 'pending') return <Badge variant="secondary">Pending</Badge>;

  const style = STATUS_STYLES[status];
  if (!style) return <Badge variant="outline">{status}</Badge>;

  return <Badge className={style.className}>{style.label}</Badge>;
}
