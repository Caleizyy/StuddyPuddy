import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type StatTileProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'normal' | 'warning';
};

export function StatTile({ label, value, hint, tone = 'normal' }: StatTileProps) {
  return (
    <Card size="sm">
      <CardContent className="space-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p
          className={cn(
            'text-2xl font-semibold tabular-nums',
            tone === 'warning' && 'text-destructive',
          )}
        >
          {value}
        </p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
