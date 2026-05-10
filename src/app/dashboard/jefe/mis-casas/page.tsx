import { ModePlaceholderCard, ProtectedModePage } from '@/app/dashboard/protected-mode-page';

export default function JefeHomesPage() {
  return (
    <ProtectedModePage
      nextPath="/dashboard/jefe/mis-casas"
      eyebrow="Mis Casas"
      title="Mis Casas"
      description="Direcciones y propiedades guardadas para pedir trabajos con menos friccion."
    >
      <ModePlaceholderCard
        title="Historial de arreglos"
        description="Cada propiedad se va a poder abrir para ver el historial de arreglos y trabajos hechos en esa direccion."
      />
    </ProtectedModePage>
  );
}
