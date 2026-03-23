import { cn } from '../lib/cn';

export default function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'info' | 'warning' | 'success';
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-sky-50 text-sky-900 ring-sky-200',
    info: 'bg-sky-50 text-sky-800 ring-sky-200',
    warning: 'bg-amber-50 text-amber-900 ring-amber-200',
    success: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}
