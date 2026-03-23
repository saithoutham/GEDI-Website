import { NavLink } from 'react-router-dom';
import { cn } from '../lib/cn';
import { HeartPulse, Ribbon, Stethoscope, Wind } from 'lucide-react';

const topics = [
  { key: 'Skin cancer', icon: Ribbon },
  { key: 'Cervical cancer', icon: Ribbon },
  { key: 'Colorectal cancer', icon: Ribbon },
  { key: 'Breast cancer', icon: Ribbon },
  { key: 'Lung cancer', icon: Wind },
  { key: 'Prostate cancer', icon: Ribbon },
  { key: 'CVD - Hypertension', icon: HeartPulse },
  { key: 'CVD - Diabetes', icon: Stethoscope },
];

export default function TopicNav() {
  return (
    <nav className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
      {topics.map((t) => (
        <NavLink
          key={t.key}
          to={`/topic/${encodeURIComponent(t.key)}`}
          className={({ isActive }) =>
            cn(
              'group flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-sm ring-1 ring-sky-100 hover:bg-sky-50',
              isActive ? 'ring-sky-400' : ''
            )
          }
        >
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-50 ring-1 ring-inset ring-sky-200 group-hover:bg-white">
              <t.icon className="h-4 w-4 text-sky-800 group-hover:text-sky-900" />
            </span>
            <span className="font-semibold text-slate-800 group-hover:text-slate-950">{t.key}</span>
          </div>
          <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-700">View</span>
        </NavLink>
      ))}
    </nav>
  );
}
