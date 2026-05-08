import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const hasSessionCookie = cookieStore.getAll().some((cookie) => cookie.name.startsWith('sb-'));

  if (!hasSessionCookie) {
    redirect('/?next=%2Fdashboard');
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="font-display text-3xl">Protected area</CardTitle>
          <CardDescription>
            This route is reserved for authenticated users and will expand in later phases.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>Phase 00 only scaffolds the guardrail. Later phases will add role-aware access.</p>
          <p className="font-mono text-foreground">If you reached this screen, the auth gate let you through.</p>
        </CardContent>
      </Card>
    </main>
  );
}
