import { cn } from '../lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('h-4 w-full animate-pulse rounded bg-zinc-100', className)} />;
}
