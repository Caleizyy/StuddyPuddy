import { cn } from '@/lib/utils';

type AvatarProps = {
  name: string;
  src?: string | null;
  className?: string;
};

// First letters of up to two words: "Ada Lovelace" -> "AL"
export function initialsOf(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => Array.from(word)[0]?.toUpperCase() ?? '');
  return letters.join('') || '?';
}

// The user's picture, or their initials on a coloured disc when they have none
export function Avatar({ name, src, className }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-sticker bg-accent text-xs font-bold text-accent-foreground',
        className,
      )}
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <span aria-hidden>{initialsOf(name)}</span>
      )}
      <span className="sr-only">{name}</span>
    </span>
  );
}
