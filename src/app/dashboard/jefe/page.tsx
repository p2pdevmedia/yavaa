import { ModePlaceholderCard, ProtectedModePage } from '@/app/dashboard/protected-mode-page';
import type { Route } from 'next';

export default function JefeHomePage() {
  return (
    <ProtectedModePage
      nextPath="/dashboard/jefe"
      eyebrow="Modo Jefe"
      title="Inicio Jefe"
      description="Resumen para pedir ayuda, revisar urgencias y volver rapido a casas o trabajadores."
    >
      <ModePlaceholderCard
        title="Tu panel de Jefe"
        description="Desde aca vas a poder ver pedidos activos, accesos rapidos y alertas importantes."
        href={'/dashboard/jefe/urgencias' as Route}
        actionLabel="Publicar urgencia"
      />
    </ProtectedModePage>
  );
}
