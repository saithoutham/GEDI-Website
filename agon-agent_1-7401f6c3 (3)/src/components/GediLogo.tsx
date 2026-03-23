import { cn } from '../lib/cn';

export default function GediLogo({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-10 w-10', className)}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="g" x1="6" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0284C7" />
          <stop offset="0.55" stopColor="#2563EB" />
          <stop offset="1" stopColor="#4F46E5" />
        </linearGradient>
        <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(12 10) rotate(45) scale(20)">
          <stop stopColor="#7DD3FC" stopOpacity="0.9" />
          <stop offset="1" stopColor="#7DD3FC" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="2" y="2" width="36" height="36" rx="12" fill="url(#g)" />
      <rect x="2" y="2" width="36" height="36" rx="12" fill="url(#glow)" />

      {/* abstract shield */}
      <path
        d="M20 9.5c4.3 2.6 7.8 2.8 10.2 3.2v9.1c0 7-5.3 10.6-10.2 12.9-4.9-2.3-10.2-5.9-10.2-12.9v-9.1c2.4-.4 5.9-.6 10.2-3.2Z"
        fill="white"
        fillOpacity="0.92"
      />

      {/* check */}
      <path
        d="M16.2 20.7l2.4 2.5 5.7-6"
        stroke="#0F172A"
        strokeOpacity="0.55"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* small spark */}
      <circle cx="30.5" cy="9.5" r="2.1" fill="#34D399" stroke="white" strokeWidth="1.6" />
    </svg>
  );
}
