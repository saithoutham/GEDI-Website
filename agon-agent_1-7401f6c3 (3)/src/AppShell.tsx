import { Link, NavLink, Outlet } from 'react-router-dom';
import { cn } from './lib/cn';
import { BookOpen, Home, Info, Sparkles, Stethoscope } from 'lucide-react';
import BrandBar from './components/BrandBar';
import { useViewMode } from './lib/viewMode';

function TopNavLink({ to, label, icon: Icon }: { to: string; label: string; icon: any }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition',
          isActive ? 'bg-sky-700 text-white' : 'text-sky-900 hover:bg-sky-50'
        )
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );
}

export default function AppShell() {
  const { viewMode, toggleViewMode } = useViewMode();
  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-50 to-white text-slate-900">
      <BrandBar
        right={
          <div className="flex items-center gap-2">
            {viewMode === 'clinician' ? (
              <span className="rounded-full bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-900 ring-1 ring-inset ring-sky-200">
                Clinician View
              </span>
            ) : null}
            <button
              type="button"
              onClick={toggleViewMode}
              className="inline-flex items-center gap-2 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-sky-900 ring-1 ring-inset ring-sky-200 hover:bg-sky-50"
              aria-pressed={viewMode === 'clinician'}
            >
              <span className="relative inline-flex h-4 w-7 items-center rounded-full bg-slate-200">
                <span
                  className={cn(
                    'inline-block h-3 w-3 translate-x-0.5 rounded-full bg-white shadow-sm transition',
                    viewMode === 'clinician' ? 'translate-x-3.5 bg-white' : ''
                  )}
                />
              </span>
              {viewMode === 'clinician' ? 'Clinician View' : 'Patient View'}
            </button>
          </div>
        }
      />
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="relative">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-600 text-white shadow-sm">
                <Stethoscope className="h-5 w-5" />
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight text-slate-900">GEDI Screening Hub</p>
              <p className="text-xs text-slate-600">Guidelines • Resources • Eligibility</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 sm:flex">
            <TopNavLink to="/" label="Home" icon={Home} />
            <TopNavLink to="/explore" label="Explore" icon={BookOpen} />
            <TopNavLink to="/eligibility" label="Eligibility" icon={Sparkles} />
            <TopNavLink to="/about" label="About" icon={Info} />
          </nav>

          <div className="sm:hidden">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-700 px-3 py-2 text-sm font-semibold text-white"
            >
              <BookOpen className="h-4 w-4" />
              Explore
            </Link>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-zinc-200/70 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold text-zinc-900">GEDI Screening Hub</div>
            <div className="text-xs text-zinc-500">
              Built for education & quality improvement. Verify against primary sources.
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1">
              <Stethoscope className="h-3.5 w-3.5" />
              Preventive care
            </span>
            <span className="inline-flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              Screening guidelines
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
