import { ModePlaceholderCard, ProtectedModePage } from '@/app/dashboard/protected-mode-page';

export default function JefeWorkersPage() {
  return (
    <ProtectedModePage
      nextPath="/dashboard/jefe/trabajadores"
      eyebrow="Trabajadores"
      title="Trabajadores"
      description="Buscar, favoritos e historial viven dentro de esta pestaña."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <ModePlaceholderCard title="Buscar" description="Descubrir trabajadores por categoria, zona y disponibilidad." />
        <ModePlaceholderCard title="Favoritos" description="Trabajadores guardados por confianza o uso frecuente." />
        <ModePlaceholderCard title="Historial" description="Trabajadores con pedidos, urgencias o chats anteriores." />
      </div>
    </ProtectedModePage>
  );
}
