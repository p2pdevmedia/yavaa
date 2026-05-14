import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Metadata } from 'next';
import Link from 'next/link';

import { YavaaPageShell } from '@/components/ui/yavaa-layout';
import { APP_NAME } from '@/lib/app-metadata';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: `Agent API | ${APP_NAME}`,
  description: 'Documentacion publica para que agentes usen la misma API que la web de Yavaa.'
};

function getAgentApiMarkdown(): string {
  return readFileSync(join(process.cwd(), 'docs/api/agent-api.md'), 'utf8');
}

export default function ApiDocsPage() {
  const agentApiMarkdown = getAgentApiMarkdown();

  return (
    <YavaaPageShell width="xl" className="py-6 sm:py-10">
      <div className="space-y-8">
        <header className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 text-sm font-extrabold text-foreground">
              <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-primary text-sm font-black text-primary-foreground shadow-soft">
                Y
              </span>
              {APP_NAME}
            </Link>
            <div className="space-y-3">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Docs publicas</p>
              <h1 className="max-w-3xl font-display text-4xl font-black leading-none tracking-normal text-foreground sm:text-5xl">
                Agent API
              </h1>
              <p className="max-w-3xl text-base leading-7 text-muted-foreground">
                Guia publica para que un agente use Supabase Auth y llame los mismos endpoints HTTP que usa la UI de
                Yavaa.
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-card px-5 text-sm font-bold text-foreground transition-colors hover:bg-muted"
          >
            Volver al inicio
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-3" aria-labelledby="security-review-title">
          <div className="md:col-span-1">
            <h2 id="security-review-title" className="text-xl font-black text-foreground">
              Analisis de seguridad
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Esta ruta publica solo informacion de contrato y ejemplos con placeholders.
            </p>
          </div>
          <div className="grid gap-3 md:col-span-2">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm font-black text-foreground">Sin secretos</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                La pagina no lee variables de entorno, cookies, tokens, base de datos ni service role keys.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm font-black text-foreground">Sin permisos nuevos</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Publicar la documentacion no cambia la API: cada accion protegida sigue validando bearer token,
                usuario local, estado activo, rol y onboarding del lado servidor.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="agent-api-markdown-title" className="space-y-3">
          <div className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="agent-api-markdown-title" className="text-2xl font-black text-foreground">
                Guia completa
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Fuente: <code className="font-mono text-xs">docs/api/agent-api.md</code>
              </p>
            </div>
            <p className="text-sm font-bold text-muted-foreground">Ruta publica: /docs/api</p>
          </div>

          <pre className="max-h-none overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-card p-4 text-sm leading-6 text-foreground shadow-soft sm:p-6">
            <code>{agentApiMarkdown}</code>
          </pre>
        </section>
      </div>
    </YavaaPageShell>
  );
}
