import Link from 'next/link';
import type { Route } from 'next';
import { Search, UsersRound } from 'lucide-react';

import { ProtectedModePage } from '@/app/dashboard/protected-mode-page';
import { PublicProviderCard } from '@/components/providers/public-provider-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { listPublicProviders } from '@/lib/public-discovery';

function normalizeSearchParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    const firstValue = value[0]?.trim();
    return firstValue ? firstValue : null;
  }

  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : null;
}

type JefeWorkersPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
  }>;
};

export default async function JefeWorkersPage({ searchParams }: JefeWorkersPageProps) {
  const resolvedSearchParams = (await Promise.resolve(searchParams)) ?? {};
  const query = normalizeSearchParam(resolvedSearchParams.q);
  const providers = await listPublicProviders({ query });
  const resultLabel = query
    ? `${providers.items.length} resultado${providers.items.length === 1 ? '' : 's'}`
    : `${providers.items.length} trabajador${providers.items.length === 1 ? '' : 'es'}`;

  return (
    <ProtectedModePage
      nextPath="/dashboard/jefe/trabajadores"
      eyebrow="Trabajadores"
      title="Trabajadores"
      description="Buscá contratistas aprobados y activos para pedir trabajos, urgencias o revisar perfiles antes de coordinar."
    >
      <div className="space-y-6">
        <form method="get">
          <Card className="border-border/70 bg-card/95 shadow-soft">
            <CardContent className="grid gap-4 pt-6 md:grid-cols-[1fr_auto] md:items-end">
              <div className="grid gap-2">
                <Label htmlFor="worker-search">Buscar trabajador</Label>
                <Input
                  id="worker-search"
                  name="q"
                  defaultValue={query ?? ''}
                  placeholder="Nombre, oficio o zona"
                  autoComplete="off"
                />
              </div>

              <div className="flex flex-wrap gap-2 md:justify-end">
                <Button type="submit" className="gap-2">
                  <Search className="h-4 w-4" />
                  Buscar
                </Button>
                {query ? (
                  <Button asChild variant="outline">
                    <Link href={'/dashboard/jefe/trabajadores' as Route}>Limpiar</Link>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </form>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="font-display text-2xl font-semibold tracking-normal">Contratistas activados</h2>
              <p className="text-sm text-muted-foreground">
                Solo se listan perfiles aprobados con usuario activo.
              </p>
            </div>
            <Badge variant="secondary" className="gap-1">
              <UsersRound className="h-3.5 w-3.5" />
              {resultLabel}
            </Badge>
          </div>

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
                  No encontramos trabajadores
                </CardTitle>
                <CardDescription>
                  Probá buscar por otro nombre, oficio o zona para ver contratistas activados.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </section>
      </div>
    </ProtectedModePage>
  );
}
