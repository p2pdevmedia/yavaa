import { redirect } from 'next/navigation';
import type { Route } from 'next';
import Link from 'next/link';

import {
  DashboardDatabaseUnavailableState,
  DashboardUnlinkedUserState
} from '@/components/dashboard/dashboard-states';
import { Button } from '@/components/ui/button';
import { YavaaPageShell } from '@/components/ui/yavaa-layout';
import { getDashboardPageContext } from '@/lib/dashboard-page-data';
import { hasCompletedOnboarding } from '@/lib/onboarding';
import { canSelectProfileMode } from '@/lib/permissions';
import { getPrivateProfileAvatarSrc } from '@/lib/profile-avatar';

export default async function JefePublicProfilePage() {
  const context = await getDashboardPageContext('/dashboard/jefe/perfil');

  if (context.kind === 'database-unavailable') {
    return <DashboardDatabaseUnavailableState email={context.email} />;
  }

  if (context.kind === 'unlinked-user') {
    return <DashboardUnlinkedUserState email={context.authState.user?.email ?? null} />;
  }

  if (!canSelectProfileMode(context.appUser.permissionContext, 'jefe')) {
    redirect('/dashboard/seleccionar-modo' as Route);
  }

  if (!hasCompletedOnboarding(context.appUser.user.profile, 'jefe')) {
    redirect('/dashboard/onboarding/jefe' as Route);
  }

  const profile = context.appUser.user.profile;
  const firstName = profile?.firstName ?? 'Tu perfil';
  const lastName = profile?.lastName ?? '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const avatarSrc = profile?.avatarUrl ? getPrivateProfileAvatarSrc(profile.avatarUrl) : null;

  return (
    <YavaaPageShell width="md" className="py-5">
      <section className="space-y-5">
        <div className="rounded-[30px] bg-primary p-6 text-primary-foreground shadow-soft">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] opacity-80">Perfil público</p>
          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary-foreground/30 bg-primary-foreground/15">
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarSrc} alt={`Foto de perfil de ${firstName}`} className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-black">{firstName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0 space-y-3">
              <h1 className="font-display text-4xl font-bold leading-tight tracking-normal">{fullName}</h1>
              <p className="text-sm leading-6 opacity-90">
                Este es el perfil que ayuda a que los trabajadores sepan con quién van a coordinar.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
          <article className="rounded-[24px] border border-border bg-card p-5 shadow-soft">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Datos visibles</p>
            <dl className="mt-4 grid gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Nombre</dt>
                <dd className="mt-1 font-bold text-foreground">{fullName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Zona principal</dt>
                <dd className="mt-1 font-bold text-foreground">{profile?.addressText ?? 'Sin zona'}</dd>
              </div>
            </dl>
          </article>

          <Button asChild className="w-full sm:w-auto">
            <Link href={'/dashboard/onboarding/jefe?editar=1' as Route}>Editar perfil</Link>
          </Button>
        </div>
      </section>
    </YavaaPageShell>
  );
}
