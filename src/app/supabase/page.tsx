import { getPrismaClient } from '@/lib/prisma';
import { hasDatabaseEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default async function SupabasePage() {
  const configured = hasDatabaseEnv();
  const prisma = configured ? getPrismaClient() : null;

  const data = configured
    ? await prisma!.$transaction([
        prisma!.market.findMany({
          orderBy: [{ isPrimary: 'desc' }, { city: 'asc' }]
        }),
        prisma!.category.findMany({
          orderBy: [{ isInitial: 'desc' }, { name: 'asc' }]
        }),
        prisma!.role.findMany({
          orderBy: { slug: 'asc' }
        })
      ])
    : [[], [], []];

  const [markets, categories, roles] = data;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-start px-4 py-12 sm:px-6 lg:px-8">
      <section className="space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Foundation data</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Esta vista confirma que la base de datos ya tiene la semilla inicial de la Etapa 0.
            Si el entorno no está configurado, la página sigue cargando en modo informativo.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-medium text-foreground">Mercados</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {configured ? (
                markets.length > 0 ? (
                  markets.map((market) => (
                    <li key={market.id}>
                      {market.city}, {market.province} - {market.country}
                      {market.isPrimary ? ' (primary)' : ''}
                    </li>
                  ))
                ) : (
                  <li>No seeded markets found.</li>
                )
              ) : (
                <li>Database env not configured.</li>
              )}
            </ul>
          </article>

          <article className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-medium text-foreground">Categorias</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {configured ? (
                categories.length > 0 ? (
                  categories.map((category) => (
                    <li key={category.id}>
                      {category.name}
                      {category.group ? ` - ${category.group}` : ''}
                    </li>
                  ))
                ) : (
                  <li>No seeded categories found.</li>
                )
              ) : (
                <li>Database env not configured.</li>
              )}
            </ul>
          </article>

          <article className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-medium text-foreground">Roles</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {configured ? (
                roles.length > 0 ? (
                  roles.map((role) => <li key={role.id}>{role.slug}</li>)
                ) : (
                  <li>No seeded roles found.</li>
                )
              ) : (
                <li>Database env not configured.</li>
              )}
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}
