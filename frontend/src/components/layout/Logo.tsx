import { cn } from '@/lib/utils';

// A drop landing in a puddle: three ripples. Used as the logo and as a quiet background shape.
export function Ripple({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden className={cn('size-8', className)}>
      <ellipse
        cx="24"
        cy="34"
        rx="21"
        ry="9"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.35"
      />
      <ellipse
        cx="24"
        cy="34"
        rx="13"
        ry="5.5"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.65"
      />
      <path
        d="M24 6c4.5 6.2 7 10 7 14a7 7 0 1 1-14 0c0-4 2.5-7.800 7-14Z"
        fill="var(--accent)"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-foreground', className)}>
      <Ripple className="size-8" />
      <span className="font-heading text-xl font-extrabold tracking-tight">StuddyPuddy</span>
    </span>
  );
}
