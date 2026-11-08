import type { PriorityBand } from '@/api/plan';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const BAND_STYLES: Record<PriorityBand, string> = {
  high: 'bg-priority-high/15 text-priority-high',
  medium: 'bg-priority-medium/15 text-priority-medium',
  low: 'bg-priority-low/15 text-priority-low',
};

const BAND_LABELS: Record<PriorityBand, string> = {
  high: 'High priority',
  medium: 'Medium priority',
  low: 'Low priority',
};

export function PriorityBadge({ band }: { band: PriorityBand }) {
  return (
    <Badge variant="outline" className={cn('border-transparent', BAND_STYLES[band])}>
      {BAND_LABELS[band]}
    </Badge>
  );
}
