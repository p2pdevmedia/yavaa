'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { getShellNavigationItems, type AppShellMode } from '@/lib/app-shell-navigation';
import { cn } from '@/lib/utils';

type BottomNativeBarProps = {
  mode: AppShellMode;
};

export function BottomNativeBar({ mode }: BottomNativeBarProps) {
  const pathname = usePathname();
  const items = getShellNavigationItems(mode);

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/92 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-12px_35px_rgba(31,26,20,0.10)] backdrop-blur-xl"
    >
      <div className="mx-auto grid max-w-md grid-flow-col auto-cols-fr gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-[8px] px-1 text-[0.68rem] font-semibold leading-tight transition',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
