import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { YavaaPageShell } from '@/components/ui/yavaa-layout';

export function DashboardDatabaseUnavailableState({ email }: { email: string | null }) {
  return (
    <YavaaPageShell width="sm" className="flex min-h-screen items-center">
      <Card className="w-full border-border/70 bg-card/90 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-3xl">Base de datos no disponible</CardTitle>
          <CardDescription>
            La sesión está activa, pero Yavaa no puede verificar tu usuario y roles ahora.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p className="font-mono text-foreground">{email ?? 'Sesión autenticada'}</p>
          <p>Volvé a intentar en unos minutos.</p>
        </CardContent>
      </Card>
    </YavaaPageShell>
  );
}

export function DashboardUnlinkedUserState({ email }: { email: string | null }) {
  return (
    <YavaaPageShell width="sm" className="flex min-h-screen items-center">
      <Card className="w-full border-border/70 bg-card/90 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-3xl">Usuario no vinculado</CardTitle>
          <CardDescription>
            La sesión está activa, pero todavía no hay un usuario local de Yavaa vinculado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p className="font-mono text-foreground">{email ?? 'Sesión autenticada'}</p>
          <p>Cuando el usuario local exista, vas a poder elegir Jefe o Trabajador.</p>
        </CardContent>
      </Card>
    </YavaaPageShell>
  );
}
