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
          <CardTitle className="font-display text-3xl">Área protegida</CardTitle>
          <CardDescription>
            Esta ruta está reservada para usuarios autenticados y crecerá en fases posteriores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>La fase 00 solo deja montada la protección inicial. Después agregaremos acceso según rol.</p>
          <p className="font-mono text-foreground">
            Si llegaste a esta pantalla, la validación de autenticación te dejó pasar.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
