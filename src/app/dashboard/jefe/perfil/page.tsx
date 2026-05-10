import { ModePlaceholderCard, ProtectedModePage } from '@/app/dashboard/protected-mode-page';

export default function JefeProfilePage() {
  return (
    <ProtectedModePage
      nextPath="/dashboard/jefe/perfil"
      eyebrow="Perfil"
      title="Perfil Jefe"
      description="Cuenta, datos personales y cambio de modo."
    >
      <ModePlaceholderCard
        title="Datos de cuenta"
        description="Este modulo conecta con el perfil existente y mantiene el cambio a Trabajador disponible desde Perfil."
      />
    </ProtectedModePage>
  );
}
