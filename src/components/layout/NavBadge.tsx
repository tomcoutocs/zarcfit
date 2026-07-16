import { cn } from '@/lib/utils';

type NavBadgeProps = {
  count: number;
  className?: string;
};

export function NavBadge({ count, className }: NavBadgeProps) {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        'ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
