'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useState } from 'react';

import { SignOutButton } from '@/components/auth/sign-out-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AppShellUserControlsState } from '@/lib/app-shell-user-controls';
import type { DashboardNotification } from '@/lib/dashboard-notifications';

type FloatingUserControlsProps = AppShellUserControlsState;

function formatName(user: FloatingUserControlsProps['user']): string {
  const namePieces = [user.profile?.firstName, user.profile?.lastName].filter(
    (value): value is string => Boolean(value)
  );

  return namePieces.length > 0 ? namePieces.join(' ') : user.displayName ?? user.email;
}

function getUserInitials(user: FloatingUserControlsProps['user']): string {
  const namePieces = [user.profile?.firstName, user.profile?.lastName].filter(
    (value): value is string => Boolean(value)
  );

  if (namePieces.length >= 2) {
    return `${namePieces[0][0]}${namePieces[1][0]}`.toUpperCase();
  }

  return formatName(user).slice(0, 2).toUpperCase();
}

function formatUtcDateTime(value: string): string {
  return `${value.slice(0, 10)} ${value.slice(11, 16)} UTC`;
}

function getDashboardProfilePath(pathname: string | null): Route {
  if (pathname?.startsWith('/dashboard/trabajador')) {
    return '/dashboard/trabajador/perfil' as Route;
  }

  if (pathname?.startsWith('/dashboard/jefe') || pathname?.startsWith('/dashboard/admin')) {
    return '/dashboard/jefe/perfil' as Route;
  }

  return '/dashboard/perfil' as Route;
}

function getNotificationHref(notification: DashboardNotification, profilePath: Route): Route {
  return notification.bookingId ? ('/dashboard/bookings' as Route) : profilePath;
}

export function FloatingUserControls({ user, email, notifications }: FloatingUserControlsProps) {
  const pathname = usePathname();
  const [accountPopoverOpen, setAccountPopoverOpen] = useState(false);
  const [notificationPopoverOpen, setNotificationPopoverOpen] = useState(false);
  const unreadNotificationCount = notifications.filter((notification) => !notification.isRead).length;
  const profilePath = getDashboardProfilePath(pathname);
  const profilePhotoSrc = user.profile?.avatarUrl
    ? `/api/me/profile?avatar=${encodeURIComponent(user.profile.avatarUrl)}`
    : null;

  return (
    <div className="fixed right-4 top-4 z-50 flex items-center gap-2 sm:right-6 sm:top-6">
      <div className="relative">
        <button
          type="button"
          aria-label="Abrir notificaciones"
          aria-expanded={notificationPopoverOpen}
          className="relative flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-card/95 text-foreground shadow-soft backdrop-blur transition hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          onClick={() => {
            setNotificationPopoverOpen((current) => !current);
            setAccountPopoverOpen(false);
          }}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadNotificationCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[0.68rem] font-semibold text-primary-foreground">
              {unreadNotificationCount}
            </span>
          ) : null}
        </button>

        {notificationPopoverOpen ? (
          <div className="absolute right-0 top-14 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-border/80 bg-card p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Campana</p>
                <h3 className="font-display text-xl font-semibold text-foreground">Notificaciones</h3>
              </div>
              <Badge variant={unreadNotificationCount > 0 ? 'default' : 'secondary'}>
                {unreadNotificationCount > 0 ? `${unreadNotificationCount} nuevas` : 'Al dia'}
              </Badge>
            </div>

            <div className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-1">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <article key={notification.id} className="rounded-lg border border-border/70 bg-background/45 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={notification.isRead ? 'outline' : 'secondary'}>{notification.typeLabel}</Badge>
                      {!notification.isRead ? <Badge variant="default">Nueva</Badge> : null}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-foreground">{notification.title}</p>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">{notification.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatUtcDateTime(notification.createdAt)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={getNotificationHref(notification, profilePath)}
                          onClick={() => setNotificationPopoverOpen(false)}
                        >
                          {notification.bookingId ? 'Ver booking' : 'Abrir perfil'}
                        </Link>
                      </Button>
                      <span className="inline-flex items-center rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
                        {notification.isRead ? 'Leida' : 'Sin leer'}
                      </span>
                    </div>
                  </article>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                  No hay notificaciones por ahora.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="relative">
        <button
          type="button"
          aria-label="Abrir menu de perfil"
          aria-expanded={accountPopoverOpen}
          className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-muted font-display text-sm font-semibold text-muted-foreground shadow-soft backdrop-blur transition hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          onClick={() => {
            setAccountPopoverOpen((current) => !current);
            setNotificationPopoverOpen(false);
          }}
        >
          {profilePhotoSrc ? (
            <span
              aria-hidden="true"
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${profilePhotoSrc})` }}
            />
          ) : (
            getUserInitials(user)
          )}
        </button>

        {accountPopoverOpen ? (
          <div className="absolute right-0 top-14 w-[min(16rem,calc(100vw-2rem))] rounded-lg border border-border/80 bg-card p-3 shadow-soft">
            <div className="border-b border-border/70 px-2 pb-3">
              <p className="text-sm font-semibold text-foreground">{formatName(user)}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{email ?? user.email}</p>
            </div>

            <div className="mt-3 space-y-2">
              <Link
                href={profilePath}
                className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
                onClick={() => setAccountPopoverOpen(false)}
              >
                Perfil
              </Link>
              <SignOutButton className="w-full justify-start border-border/70 bg-card px-3" />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
