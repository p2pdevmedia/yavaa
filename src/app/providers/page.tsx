import Link from 'next/link';
import type { Route } from 'next';
import { cookies } from 'next/headers';
import { MapPin, Search, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { YavaaHero, YavaaPageShell } from '@/components/ui/yavaa-layout';
import { PublicProviderCard } from '@/components/providers/public-provider-card';
import { PublicProviderSearchForm } from '@/components/providers/public-provider-search-form';
import { listPublicCatalogCategories, listPublicCatalogMarkets } from '@/lib/public-catalog';
import { listPublicProviders } from '@/lib/public-discovery';
import { getAuthSessionState } from '@/lib/auth';

function normalizeSearchParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    const firstValue = value[0]?.trim();
    return firstValue ? firstValue : null;
  }

  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : null;
}

type ProvidersPageProps = {
  searchParams?: Promise<{
    category?: string | string[];
    market?: string | string[];
  }>;
};

export default async function ProvidersPage({ searchParams }: ProvidersPageProps) {
  const cookieStore = await cookies();
  const authState = await getAuthSessionState(cookieStore);
  const resolvedSearchParams = (await Promise.resolve(searchParams)) ?? {};
  const category = normalizeSearchParam(resolvedSearchParams.category);
  const market = normalizeSearchParam(resolvedSearchParams.market);

  const [categories, markets, providers] = await Promise.all([
    listPublicCatalogCategories(),
    listPublicCatalogMarkets(),
    listPublicProviders({ category, market })
  ]);

  return (
    <YavaaPageShell width="lg" className="space-y-8">
      <YavaaHero
        eyebrow="Descubrimiento público"
        title="Encontrá proveedores aprobados cerca de tu zona."
        description="Filtrá por categoría y ubicación antes de entrar al flujo de booking. La información pública se mantiene limitada y segura."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verificados
          </Badge>
          <Badge variant="outline" className="gap-1 bg-card">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            San Martín de los Andes
          </Badge>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={'/' as Route}>Volver al inicio</Link>
          </Button>
          {authState.authenticated ? (
            <Button asChild variant="outline">
              <Link href={'/dashboard' as Route}>Ir al dashboard</Link>
            </Button>
          ) : null}
        </div>
      </YavaaHero>

      <section className="mt-8 space-y-6">
        <form method="get" className="space-y-4">
          <PublicProviderSearchForm
            categories={categories}
            markets={markets}
            category={category}
            market={market}
          />
        </form>

        {providers.items.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {providers.items.map((provider) => (
              <PublicProviderCard key={provider.contractorProfileId} provider={provider} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-border/80 bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Search className="h-5 w-5 text-primary" />
                No encontramos resultados
              </CardTitle>
              <CardDescription>
                Probá con otra categoría o ubicación para ver contractors disponibles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href={'/providers' as Route}>Limpiar filtros</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
    </YavaaPageShell>
  );
}
