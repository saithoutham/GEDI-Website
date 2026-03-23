import { cn } from '../lib/cn';

export default function Button({
  className,
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
}) {
  const variants: Record<string, string> = {
    primary:
      'bg-sky-700 text-white hover:bg-sky-800 active:bg-sky-900 focus-visible:outline-sky-700',
    secondary:
      'bg-white text-sky-900 ring-1 ring-inset ring-sky-200 hover:bg-sky-50 active:bg-sky-100 focus-visible:outline-sky-700',
    ghost:
      'bg-transparent text-sky-900 hover:bg-sky-50 active:bg-sky-100 focus-visible:outline-sky-700',
  };
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
