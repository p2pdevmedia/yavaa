import Link from 'next/link';
import type { Route } from 'next';
import { JobPostStatus } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { YavaaPageShell } from '@/components/ui/yavaa-layout';
import type { AppUserProfile } from '@/lib/app-user';
import type { JobPostSummary } from '@/lib/job-posts';
import { getPrivateProfileAvatarSrc } from '@/lib/profile-avatar';

function getJobStatusLabel(status: JobPostStatus): string {
  const labels: Record<JobPostStatus, string> = {
    [JobPostStatus.DRAFT]: 'Borrador',
    [JobPostStatus.PUBLISHED]: 'Publicado',
    [JobPostStatus.IN_PROGRESS]: 'En progreso',
    [JobPostStatus.READY_FOR_REVIEW]: 'Listo para revisión',
    [JobPostStatus.CLOSED]: 'Terminado',
    [JobPostStatus.CANCELLED]: 'Cancelado'
  };

  return labels[status];
}

function JobPostList({
  emptyCopy,
  jobPosts,
  showEdit = false
}: {
  emptyCopy: string;
  jobPosts: JobPostSummary[];
  showEdit?: boolean;
}) {
  if (jobPosts.length === 0) {
    return <p className="mt-3 text-sm leading-6 text-muted-foreground">{emptyCopy}</p>;
  }

  return (
    <div className="mt-3 space-y-3">
      {jobPosts.map((jobPost) => (
        <div key={jobPost.id} className="space-y-3 rounded-[18px] border border-border bg-background px-4 py-3">
          <div className="space-y-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <h2 className="text-base font-bold text-foreground">{jobPost.title}</h2>
              <span className="w-fit rounded-full bg-card px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-primary">
                {getJobStatusLabel(jobPost.status)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{jobPost.addressText}</p>
          </div>
          <div className={showEdit ? 'grid grid-cols-2 gap-2' : 'grid gap-2'}>
            <Button asChild size="sm" variant="outline">
              <Link href={`/dashboard/jefe/trabajos/${jobPost.id}` as Route}>Ver</Link>
            </Button>
            {showEdit ? (
              <Button asChild size="sm">
                <Link href={`/dashboard/jefe/trabajos/${jobPost.id}/editar` as Route}>Editar</Link>
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ClientHome({ profile, jobPosts = [] }: { profile: AppUserProfile | null; jobPosts?: JobPostSummary[] }) {
  const firstName = profile?.firstName ?? 'Tu perfil';
  const avatarSrc = profile?.avatarUrl ? getPrivateProfileAvatarSrc(profile.avatarUrl) : null;
  const publishedJobPosts = jobPosts.filter((jobPost) => jobPost.status === JobPostStatus.PUBLISHED);
  const inProgressJobPosts = jobPosts.filter(
    (jobPost) => jobPost.status === JobPostStatus.IN_PROGRESS || jobPost.status === JobPostStatus.READY_FOR_REVIEW
  );
  const finishedJobPosts = jobPosts.filter((jobPost) => jobPost.status === JobPostStatus.CLOSED);

  return (
    <YavaaPageShell width="md" className="py-5">
      <section className="space-y-5">
        <div className="flex items-center gap-4 px-1">
          {avatarSrc ? (
            <Link
              href={'/dashboard/jefe/perfil' as Route}
              aria-label="Abrir perfil público"
              className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border bg-muted transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarSrc} alt={`Foto de perfil de ${firstName}`} className="h-full w-full object-cover" />
            </Link>
          ) : null}
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Cliente home</p>
            <h1 className="font-display text-3xl font-bold tracking-normal text-foreground">Hola, {firstName}</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Elegí una acción clara para resolver tu próximo trabajo sin vueltas.
            </p>
          </div>
        </div>

        <article className="rounded-[30px] bg-primary p-6 text-primary-foreground shadow-soft">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] opacity-80">Acción principal</p>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight tracking-normal">Publicá un trabajo</h2>
          <p className="mt-3 text-sm leading-6 opacity-90">
            Contá qué necesitás, dónde y cuándo. En la próxima etapa vas a poder recibir opciones cerca.
          </p>
          <Button asChild className="mt-6 w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90">
            <Link href={'/dashboard/jefe/publicar-trabajo' as Route}>Publicar trabajo</Link>
          </Button>
        </article>

        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-[24px] border border-border bg-card p-5 shadow-soft">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Secundario</p>
            <h2 className="mt-3 text-xl font-bold text-foreground">Buscar trabajadores</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Explorá perfiles cercanos cuando quieras comparar opciones.
            </p>
            <Button asChild variant="outline" className="mt-5 w-full">
              <Link href={'/dashboard/jefe/buscar-trabajadores' as Route}>Buscar trabajadores</Link>
            </Button>
          </article>

          <article className="rounded-[24px] border border-dashed border-border bg-card p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Trabajos activos</p>
            <JobPostList emptyCopy="No tenés trabajos publicados esperando ofertas." jobPosts={publishedJobPosts} showEdit />
          </article>
        </div>

        <section className="space-y-4">
          <article className="rounded-[24px] border border-border bg-card p-5 shadow-soft">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Trabajos en progreso</p>
            <JobPostList emptyCopy="No tenés trabajos en progreso todavía." jobPosts={inProgressJobPosts} />
          </article>

          <article className="rounded-[24px] border border-border bg-card p-5 shadow-soft">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Trabajos terminados</p>
            <JobPostList emptyCopy="Los trabajos cerrados van a aparecer acá." jobPosts={finishedJobPosts} />
          </article>
        </section>
      </section>
    </YavaaPageShell>
  );
}
