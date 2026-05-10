import { ModePlaceholderCard, ProtectedModePage } from '@/app/dashboard/protected-mode-page';

export default function TrabajadorEmergenciesPage() {
  return (
    <ProtectedModePage
      nextPath="/dashboard/trabajador/urgencias"
      eyebrow="Urgencias"
      title="Navegar urgencias"
      description="En modo Trabajador, Urgencias sirve para ver solicitudes urgentes existentes y disponibles."
    >
      <ModePlaceholderCard
        title="Urgencias disponibles"
        description="Las respuestas a urgencias van a validar rol, aprobacion, deuda y disponibilidad en el servidor."
      />
    </ProtectedModePage>
  );
}
