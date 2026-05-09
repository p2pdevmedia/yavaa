import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { PublicCatalogCategory, PublicCatalogMarket } from '@/lib/public-catalog';
import { cn } from '@/lib/utils';

type PublicProviderSearchFormProps = {
  categories: PublicCatalogCategory[];
  markets: PublicCatalogMarket[];
  category: string | null;
  market: string | null;
};

const selectClassName =
  'flex h-11 w-full rounded-2xl border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export function PublicProviderSearchForm({
  categories,
  markets,
  category,
  market
}: PublicProviderSearchFormProps) {
  return (
    <Card className="border-border/70 bg-card/95">
      <CardContent className="grid gap-4 pt-6 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <div className="grid gap-2">
          <Label htmlFor="category">Categoría</Label>
          <select
            id="category"
            name="category"
            defaultValue={category ?? ''}
            className={cn(selectClassName)}
          >
            <option value="">Todas</option>
            {categories.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="market">Ubicación</Label>
          <select
            id="market"
            name="market"
            defaultValue={market ?? ''}
            className={cn(selectClassName)}
          >
            <option value="">Todas</option>
            {markets.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.city}, {item.province}
              </option>
            ))}
          </select>
        </div>

        <Button type="submit" formMethod="get" className="md:self-end">
          Buscar
        </Button>
      </CardContent>
    </Card>
  );
}
