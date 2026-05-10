import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Route } from 'next';

import {
  DashboardDatabaseUnavailableState,
  DashboardUnlinkedUserState
} from '@/components/dashboard/dashboard-states';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { YavaaPageShell } from '@/components/ui/yavaa-layout';
import { getDashboardPageContext } from '@/lib/dashboard-page-data';

type ProtectedModePageProps = {
  nextPath: string;
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export async function ProtectedModePage({
  nextPath,
  eyebrow,
  title,
  description,
  children
}: ProtectedModePageProps) {
  const context = await getDashboardPageContext(nextPath);

  if (context.kind === 'database-unavailable') {
    return <DashboardDatabaseUnavailableState email={context.email} />;
  }

  if (context.kind === 'unlinked-user') {
    return <DashboardUnlinkedUserState email={context.authState.user?.email ?? null} />;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <YavaaPageShell width="lg" className="py-8">
        <section className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
            <h1 className="font-display text-4xl font-semibold tracking-normal">{title}</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          {children}
        </section>
      </YavaaPageShell>
    </main>
  );
}

export function ModePlaceholderCard({
  title,
  description,
  href,
  actionLabel
}: {
  title: string;
  description: string;
  href?: Route;
  actionLabel?: string;
}) {
  return (
    <Card className="border-border/70 bg-card/95 shadow-soft">
      <CardHeader>
        <CardTitle className="font-display text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {href && actionLabel ? (
        <CardContent>
          <Button asChild>
            <Link href={href}>{actionLabel}</Link>
          </Button>
        </CardContent>
      ) : null}
    </Card>
  );
}
