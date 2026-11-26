import * as React from 'react';
import { cn } from '@/lib/utils';

// The browser's own dropdown, dressed like our inputs. Good for short filter lists:
// it works with the keyboard and on phones without any extra code.
function NativeSelect({ className, ...props }: React.ComponentProps<'select'>) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        'h-11 rounded-lg border border-input bg-card px-3 text-sm font-medium outline-none transition-colors focus-visible:border-ring [&>option]:bg-popover [&>option]:text-popover-foreground',
        className,
      )}
      {...props}
    />
  );
}

export { NativeSelect };
