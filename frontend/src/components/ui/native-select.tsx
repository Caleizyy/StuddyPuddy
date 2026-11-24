import * as React from 'react';
import { cn } from '@/lib/utils';

// The browser's own dropdown, dressed like our inputs. Good for short filter lists:
// it works with the keyboard and on phones without any extra code.
function NativeSelect({ className, ...props }: React.ComponentProps<'select'>) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        'h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 [&>option]:bg-popover [&>option]:text-popover-foreground',
        className,
      )}
      {...props}
    />
  );
}

export { NativeSelect };
