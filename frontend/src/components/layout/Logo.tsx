import { cn } from '@/lib/utils';

// Three notes tilted on top of each other: a pile of deadlines. Also used as the favicon.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={cn('size-8 text-primary', className)}>
      <rect
        x="8"
        y="6"
        width="26"
        height="30"
        rx="6.5"
        fill="currentColor"
        opacity=".3"
        transform="rotate(-16 21 21)"
      />
      <rect
        x="10"
        y="8"
        width="26"
        height="30"
        rx="6.5"
        fill="currentColor"
        opacity=".6"
        transform="rotate(-2 23 23)"
      />
      <rect
        x="12"
        y="11"
        width="26"
        height="30"
        rx="6.5"
        fill="currentColor"
        transform="rotate(12 25 26)"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-foreground', className)}>
      <LogoMark className="size-8" />
      <span className="font-heading text-xl font-semibold tracking-tight">StuddyPuddy</span>
    </span>
  );
}
