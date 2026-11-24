import { LoaderCircle } from 'lucide-react';

// A small spinner with text, announced to screen readers while content loads
export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 p-10 text-muted-foreground"
    >
      <LoaderCircle className="size-5 animate-spin" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
