import Link from 'next/link';
import type { Route } from 'next';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getPublicProviderProfile } from '@/lib/public-discovery';

type ProviderProfilePageProps = {
  params: Promise<{
    contractorProfileId: string;
  }>;
};

export default async function ProviderProfilePage({ params }: ProviderProfilePageProps) {
  const { contractorProfileId } = await params;
  const provider = await getPublicProviderProfile(contractorProfileId);

  if (!provider) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">Perfil público</Badge>
          <Badge variant="outline">Limitado</Badge>
          <Badge variant={provider.acceptsEmergencies ? 'default' : 'secondary'}>
            {provider.acceptsEmergencies ? 'Acepta urgencias' : 'Sin urgencias'}
          </Badge>
        </div>

        <div className="space-y-4">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl font-display">
            {provider.displayName}
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            Este perfil muestra solo la información pública necesaria para decidir si querés avanzar.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={'/providers' as Route}>Volver a resultados</Link>
          </Button>
        </div>
      </section>

      <section className="mt-8 grid gap-6">
        <Card className="border-border/70 bg-card/95">
          <CardHeader className="space-y-3">
            <CardTitle className="text-2xl">{provider.displayName}</CardTitle>
            <CardDescription>
              {provider.marketCity && provider.marketProvince
                ? `${provider.marketCity}, ${provider.marketProvince}`
                : 'Cobertura pública disponible'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {provider.bio ? <p className="text-sm leading-6 text-muted-foreground">{provider.bio}</p> : null}

            <div className="flex flex-wrap gap-2">
              <Badge variant={provider.acceptsEmergencies ? 'default' : 'secondary'}>
                {provider.acceptsEmergencies ? 'Disponible para emergencias' : 'No disponible para emergencias'}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              {provider.categories.map((category) => (
                <Badge key={category.slug} variant={category.isPrimary ? 'default' : 'secondary'}>
                  {category.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95">
          <CardHeader>
            <CardTitle className="text-xl">Zonas de trabajo</CardTitle>
            <CardDescription>Las zonas públicas son las únicas que se usan para discovery.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {provider.workZones.map((workZone) => (
              <Badge key={workZone.slug} variant="outline">
                {workZone.name}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
