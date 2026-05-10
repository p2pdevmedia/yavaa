import Link from 'next/link';
import type { Route } from 'next';
import { notFound } from 'next/navigation';
import { BadgeCheck, MapPin, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { YavaaHero, YavaaPageShell } from '@/components/ui/yavaa-layout';
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
    <YavaaPageShell width="sm" className="space-y-8">
      <YavaaHero
        eyebrow="Perfil público"
        title={provider.displayName}
        description="Este perfil muestra solo la información pública necesaria para decidir si querés avanzar."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="gap-1">
            <BadgeCheck className="h-3.5 w-3.5" />
            Verificado
          </Badge>
          <Badge variant="outline" className="bg-card">Limitado</Badge>
          <Badge variant={provider.acceptsEmergencies ? 'default' : 'secondary'}>
            {provider.acceptsEmergencies ? 'Acepta urgencias' : 'Sin urgencias'}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={'/providers' as Route}>Volver a resultados</Link>
          </Button>
        </div>
      </YavaaHero>

      <section className="mt-8 grid gap-6">
        <Card className="border-border/70 bg-card/95">
          <CardHeader className="space-y-3">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted font-display text-2xl font-semibold text-muted-foreground">
                {provider.displayName.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-2xl">{provider.displayName}</CardTitle>
                <CardDescription className="mt-1 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {provider.marketCity && provider.marketProvince
                    ? `${provider.marketCity}, ${provider.marketProvince}`
                    : 'Cobertura pública disponible'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {provider.bio ? <p className="text-sm leading-6 text-muted-foreground">{provider.bio}</p> : null}

            <div className="flex flex-wrap gap-2">
              <Badge variant={provider.acceptsEmergencies ? 'default' : 'secondary'} className="gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
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
    </YavaaPageShell>
  );
}
