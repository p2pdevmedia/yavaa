import Link from 'next/link';
import type { Route } from 'next';
import { BadgeCheck, MapPin } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { PublicProviderCard as PublicProviderCardData } from '@/lib/public-discovery';

type PublicProviderCardProps = {
  provider: PublicProviderCardData;
};

export function PublicProviderCard({ provider }: PublicProviderCardProps) {
  return (
    <Card className="h-full border-border/70 bg-card/95 shadow-soft">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl">
              {provider.displayName}
              <BadgeCheck className="h-4 w-4 text-secondary-foreground" />
            </CardTitle>
            <CardDescription className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              {provider.marketCity && provider.marketProvince
                ? `${provider.marketCity}, ${provider.marketProvince}`
              : 'Cobertura pública disponible'}
            </CardDescription>
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted font-display text-sm font-semibold text-muted-foreground">
            {provider.displayName.slice(0, 1).toUpperCase()}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {provider.bio ? <p className="text-sm leading-6 text-muted-foreground">{provider.bio}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Badge variant={provider.acceptsEmergencies ? 'default' : 'secondary'}>
            {provider.acceptsEmergencies ? 'Acepta urgencias' : 'Sin urgencias'}
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

      <CardFooter className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          {provider.marketSlug ? `Zona: ${provider.marketSlug}` : 'Zona no publicada'}
        </span>
        <Button asChild variant="outline">
          <Link href={`/providers/${provider.contractorProfileId}` as Route}>Ver perfil</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
