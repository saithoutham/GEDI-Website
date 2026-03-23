import { useMemo } from 'react';

export default function AgeRangeBar({
  ageMin,
  ageMax,
  currentAge,
}: {
  ageMin: number;
  ageMax: number;
  currentAge?: number;
}) {
  const min = Math.max(0, Math.min(90, ageMin));
  const max = Math.max(0, Math.min(90, ageMax));

  const left = Math.min(min, max);
  const right = Math.max(min, max);

  const width = 320;
  const height = 44;
  const padX = 10;
  const barY = 18;
  const barH = 8;
  const barW = width - padX * 2;

  const xForAge = (age: number) => padX + (barW * age) / 90;

  const activeX = xForAge(left);
  const activeW = xForAge(right) - xForAge(left);

  const markerX = useMemo(() => {
    if (typeof currentAge !== 'number' || !Number.isFinite(currentAge)) return null;
    if (currentAge < 0 || currentAge > 90) return null;
    return xForAge(currentAge);
  }, [currentAge]);

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-inset ring-sky-100">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Recommended age range</p>
          <p className="mt-1 text-xs text-slate-500">Based on the first guideline shown for this topic.</p>
        </div>
        <div className="text-xs font-semibold text-slate-700">{left}–{right}</div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
          {/* base */}
          <rect x={padX} y={barY} width={barW} height={barH} rx={barH / 2} fill="#E2E8F0" />
          {/* active */}
          <rect x={activeX} y={barY} width={Math.max(0, activeW)} height={barH} rx={barH / 2} fill="#0EA5E9" />

          {/* marker */}
          {markerX != null ? (
            <path
              d={`M ${markerX} ${barY - 2} L ${markerX - 6} ${barY - 12} L ${markerX + 6} ${barY - 12} Z`}
              fill="#0284C7"
            />
          ) : null}

          {/* labels */}
          <text x={activeX} y={barY + 24} fontSize="10" fill="#0F172A" textAnchor="middle">
            {left}
          </text>
          <text x={activeX + Math.max(0, activeW)} y={barY + 24} fontSize="10" fill="#0F172A" textAnchor="middle">
            {right}
          </text>
        </svg>
      </div>
    </div>
  );
}
