import { ModePlaceholderCard, ProtectedModePage } from '@/app/dashboard/protected-mode-page';

export default function TrabajadorProfilePage() {
  return (
    <ProtectedModePage
      nextPath="/dashboard/trabajador/perfil"
      eyebrow="Perfil"
      title="Perfil Trabajador"
      description="Perfil laboral, aprobacion y cambio de modo."
    >
      <ModePlaceholderCard
        title="Perfil laboral"
        description="El Trabajador puede entrar al menu aunque falte completar el perfil, pero las acciones sensibles quedan bloqueadas."
      />
    </ProtectedModePage>
  );
}
