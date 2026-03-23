export default function BrandBar({
  logoSrc = '/alcsi-logo.png',
  right,
}: {
  logoSrc?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="border-b border-sky-100 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2">
        <div className="flex items-center gap-3">
          <img
            src={logoSrc}
            alt="ALCSI logo"
            className="h-8 w-auto rounded-md"
            onError={(e) => {
              // Hide if not provided yet
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="leading-tight">
            <p className="text-xs font-semibold tracking-wide text-sky-900">An ALCSI Initiative</p>
            <p className="text-[11px] text-slate-600">American Lung Cancer Screening Initiative</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {right ? right : null}
          <div className="hidden text-[11px] text-slate-500 sm:block">Educational guidance hub</div>
        </div>
      </div>
    </div>
  );
}
