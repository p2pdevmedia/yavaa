import { YavaaHero, YavaaPageShell } from '@/components/ui/yavaa-layout';
import { hasDatabaseEnv } from '@/lib/env';
import { getPrismaClient } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type MarketRow = {
  id: string;
  city: string;
  province: string;
  country: string;
  is_primary: boolean;
};

type CategoryRow = {
  id: string;
  name: string;
  category_group: string | null;
};

type RoleRow = {
  id: string;
  slug: string;
};

export default async function SupabasePage() {
  const configured = hasDatabaseEnv();
  const prisma = configured ? getPrismaClient() : null;

  const [markets, categories, roles] = configured && prisma
    ? await Promise.all([
        prisma.$queryRaw<MarketRow[]>`
          SELECT
            id,
            city,
            province,
            country,
            is_primary
          FROM markets
          ORDER BY is_primary DESC, city ASC
        `,
        prisma.$queryRaw<CategoryRow[]>`
          SELECT
            id,
            name,
            category_group
          FROM categories
          ORDER BY is_initial DESC, name ASC
        `,
        prisma.$queryRaw<RoleRow[]>`
          SELECT
            id,
            slug
          FROM roles
          ORDER BY slug ASC
        `
      ])
    : [[], [], []];

  return (
    <YavaaPageShell width="md" className="space-y-8 py-12">
      <YavaaHero
        eyebrow="Datos operativos"
        title="Datos operativos"
        description="Esta vista confirma que la base de datos ya tiene la semilla inicial. Si el entorno no está configurado, la página sigue cargando en modo informativo."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-lg border border-border bg-card/95 p-4 shadow-soft">
          <h2 className="text-sm font-medium text-foreground">Mercados</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {configured ? (
              markets.length > 0 ? (
                markets.map((market) => (
                  <li key={market.id}>
                    {market.city}, {market.province} - {market.country}
                    {market.is_primary ? ' (primary)' : ''}
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

        <article className="rounded-lg border border-border bg-card/95 p-4 shadow-soft">
          <h2 className="text-sm font-medium text-foreground">Categorias</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {configured ? (
              categories.length > 0 ? (
                categories.map((category) => (
                  <li key={category.id}>
                    {category.name}
                    {category.category_group ? ` - ${category.category_group}` : ''}
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

        <article className="rounded-lg border border-border bg-card/95 p-4 shadow-soft">
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
    </YavaaPageShell>
  );
}
