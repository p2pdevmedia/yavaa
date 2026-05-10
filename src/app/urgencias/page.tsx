import { GuestShell } from '@/components/app-shell/guest-shell';
import { PublicEmergencyDraftForm } from '@/components/emergencies/public-emergency-draft-form';
import { YavaaPageShell } from '@/components/ui/yavaa-layout';

export default function PublicEmergenciesPage() {
  return (
    <GuestShell>
      <main className="min-h-screen bg-background text-foreground">
        <YavaaPageShell width="md" className="py-8">
          <section className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Urgencias</p>
              <h1 className="font-display text-4xl font-semibold tracking-normal">Necesito ayuda ahora</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Las personas deslogueadas pueden preparar el pedido. Al enviarlo, Yavaa pide acceso y vuelve al modo Jefe.
              </p>
            </div>

            <PublicEmergencyDraftForm />
          </section>
        </YavaaPageShell>
      </main>
    </GuestShell>
  );
}
