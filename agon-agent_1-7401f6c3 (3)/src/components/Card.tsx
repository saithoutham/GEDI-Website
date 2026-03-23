import { cn } from '../lib/cn';

export default function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white ring-1 ring-sky-100 shadow-sm shadow-sky-100/40',
        className
      )}
      {...props}
    />
  );
}
