# Bottom Tabs Navigator Design

## Goal

Add a logged-in bottom tabs navigator for the protected dashboard experience.

## Scope

- Show the navigator only inside `/dashboard` routes.
- Keep Chat out of scope for now.
- Use three tabs: `Inicio`, a mode-specific tab, and `Perfil`.
- For `jefe`, the contextual tab is `Trabajadores` and links to `/dashboard/jefe/buscar-trabajadores`.
- For `trabajador`, the contextual tab is `Trabajos` and links to `/dashboard/trabajador/trabajos`.
- `Perfil` links to the existing jefe profile page for `jefe`; for `trabajador`, it links to `/dashboard/trabajador/perfil`.
- Add the minimal worker profile route at `/dashboard/trabajador/perfil` so the `Perfil` tab has a distinct destination.
- Do not add database tables, product domains, or new protected actions.

## Architecture

Dashboard mode is inferred from the current dashboard pathname. A pure helper returns tab metadata for the active mode, and a client component uses `usePathname()` to mark the active tab. The existing `src/app/dashboard/layout.tsx` wraps children with the navigator so page components stay focused on business content.

## UX

The visual direction is the Custom Yavaa option: a compact bottom bar with three separate touch targets, Yavaa colors, and a lifted active state. Labels use Spanish app language: `Inicio`, `Trabajadores` or `Trabajos`, and `Perfil`.

## Testing

Add deterministic Vitest coverage for route-to-mode inference and tab metadata. Existing lint, typecheck, test, and build commands remain the completion gate.
