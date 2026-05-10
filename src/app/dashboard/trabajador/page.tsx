import { ModePlaceholderCard, ProtectedModePage } from '@/app/dashboard/protected-mode-page';
import type { Route } from 'next';

export default function TrabajadorHomePage() {
  return (
    <ProtectedModePage
      nextPath="/dashboard/trabajador"
      eyebrow="Modo Trabajador"
      title="Inicio Trabajador"
      description="Resumen laboral para ver urgencias, clientes y estado del perfil."
    >
      <ModePlaceholderCard
        title="Tu panel de Trabajador"
        description="Si el perfil laboral esta incompleto, el menu sigue visible pero las acciones sensibles quedan bloqueadas."
        href={'/dashboard/trabajador/perfil' as Route}
        actionLabel="Completar perfil"
      />
    </ProtectedModePage>
  );
}
