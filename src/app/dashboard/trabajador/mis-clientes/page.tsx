import { ModePlaceholderCard, ProtectedModePage } from '@/app/dashboard/protected-mode-page';

export default function TrabajadorClientsPage() {
  return (
    <ProtectedModePage
      nextPath="/dashboard/trabajador/mis-clientes"
      eyebrow="Mis Clientes"
      title="Mis Clientes"
      description="Clientes con trabajos aceptados o completados."
    >
      <ModePlaceholderCard
        title="Clientes reales"
        description="No se muestran contactos potenciales que solo preguntaron o chatearon sin trabajo aceptado."
      />
    </ProtectedModePage>
  );
}
