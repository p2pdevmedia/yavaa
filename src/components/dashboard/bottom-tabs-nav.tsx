'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { getDashboardBottomTabsForMode, getDashboardModeFromPathname } from '@/lib/dashboard-routes';
import { cn } from '@/lib/utils';

const iconByLabel: Record<string, string> = {
  Inicio: '⌂',
  Perfil: '◎',
  Trabajadores: '▦',
  Trabajos: '□'
};

export function BottomTabsNav() {
  const pathname = usePathname();
  const mode = getDashboardModeFromPathname(pathname);

  if (!mode) {
    return null;
  }

  const tabs = getDashboardBottomTabsForMode(mode);

  return (
    <nav
      aria-label="Navegación principal del dashboard"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/90 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-[0_-18px_40px_rgba(17,17,17,0.08)] backdrop-blur-xl"
    >
      <div className="mx-auto grid max-w-md grid-cols-3 items-end gap-2">
        {tabs.map((tab) => {
          const active = tab.isActive(pathname);

          return (
            <Link
              key={`${mode}-${tab.label}`}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-[18px] border border-border bg-card px-2 py-2 text-center text-[11px] font-extrabold leading-tight text-muted-foreground shadow-soft transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                active && 'min-h-16 rounded-[22px] border-primary bg-primary text-primary-foreground shadow-[0_14px_30px_rgba(110,63,243,0.28)]'
              )}
            >
              <span className="text-xl leading-none" aria-hidden="true">
                {iconByLabel[tab.label]}
              </span>
              <span className="truncate">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
