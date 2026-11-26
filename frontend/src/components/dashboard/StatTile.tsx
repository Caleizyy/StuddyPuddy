import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type StatTileProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'normal' | 'warning';
};

// One number in the summary strip. The strip itself is the card.
export function StatTile({ label, value, hint, tone = 'normal' }: StatTileProps) {
  return (
    <div className="px-4 py-2">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          'font-heading text-3xl font-extrabold tabular-nums',
          tone === 'warning' && 'text-destructive',
        )}
      >
        {value}
      </p>
      {hint && <p className="text-xs font-medium text-muted-foreground">{hint}</p>}
    </div>
  );
}
