import { ModePlaceholderCard, ProtectedModePage } from '@/app/dashboard/protected-mode-page';

export default function JefeEmergenciesPage() {
  return (
    <ProtectedModePage
      nextPath="/dashboard/jefe/urgencias"
      eyebrow="Urgencias"
      title="Publicar urgencia"
      description="En modo Jefe, Urgencias sirve para cargar y enviar pedidos urgentes."
    >
      <ModePlaceholderCard
        title="Pedido urgente"
        description="Este modulo va a retomar borradores publicos guardados antes del login y confirmar el envio con permisos server-side."
      />
    </ProtectedModePage>
  );
}
