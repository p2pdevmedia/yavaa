'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { SignOutButton } from '@/components/auth/sign-out-button';
import { dashboardNavigationItems } from '@/lib/dashboard-routes';

export function DashboardNavigation() {
  const pathname = usePathname();

  return (
    <header className="w-full border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Yavaa</p>
            <h1 className="font-display text-3xl text-foreground">Dashboard</h1>
          </div>
          <SignOutButton />
        </div>

        <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Secciones del dashboard">
          {dashboardNavigationItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'rounded-full border px-4 py-2 text-sm font-medium transition',
                  isActive
                    ? 'border-primary/40 bg-primary text-primary-foreground'
                    : 'border-border/70 bg-card/80 text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                ].join(' ')}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
