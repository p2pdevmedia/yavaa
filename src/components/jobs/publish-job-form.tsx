'use client';

import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { workerCategoryLabels, workerCategorySlugs, type WorkerCategorySlug } from '@/lib/onboarding';

type PublishJobFormState = {
  title: string;
  category: string;
  description: string;
  addressText: string;
  desiredTime: string;
};

type PublishJobResponse =
  | {
      ok: true;
      jobPost: {
        id: string;
        title: string;
        category: string;
        status: string;
      };
    }
  | {
      ok: false;
      message?: string;
      fieldErrors?: Partial<Record<keyof PublishJobFormState, string[]>>;
    };

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }

  return <p className="text-sm font-semibold text-destructive">{messages[0]}</p>;
}

export function PublishJobForm({ initialAddress = '' }: { initialAddress?: string | null }) {
  const [formState, setFormState] = useState<PublishJobFormState>({
    title: '',
    category: 'cleaning',
    description: '',
    addressText: initialAddress ?? '',
    desiredTime: ''
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof PublishJobFormState | 'form', string[]>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishedTitle, setPublishedTitle] = useState<string | null>(null);

  const payload = useMemo(
    () => ({
      title: formState.title,
      category: formState.category,
      description: formState.description,
      addressText: formState.addressText,
      ...(formState.desiredTime ? { desiredTime: new Date(formState.desiredTime).toISOString() } : {})
    }),
    [formState.addressText, formState.category, formState.description, formState.desiredTime, formState.title]
  );

  function updateField(field: keyof PublishJobFormState, value: string) {
    setFormState((current) => ({
      ...current,
      [field]: value
    }));
    setFieldErrors((current) => ({
      ...current,
      [field]: undefined,
      form: undefined
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});

    try {
      const response = await fetch('/api/job-posts', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const responseBody = (await response.json()) as PublishJobResponse;

      if (!response.ok || !responseBody.ok) {
        setFieldErrors(
          !responseBody.ok && responseBody.fieldErrors
            ? responseBody.fieldErrors
            : {
                form: [!responseBody.ok && responseBody.message ? responseBody.message : 'No pudimos publicar el trabajo.']
              }
        );
        return;
      }

      setPublishedTitle(responseBody.jobPost.title);
    } catch {
      setFieldErrors({
        form: ['No pudimos conectar con Yavaa. Probá de nuevo.']
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (publishedTitle) {
    return (
      <section className="space-y-5 rounded-[28px] border border-border bg-card p-6 shadow-soft">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Trabajo publicado</p>
        <h1 className="font-display text-3xl font-bold tracking-normal text-foreground">{publishedTitle}</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Ya quedó visible para que puedas seguir desde tu home de cliente.
        </p>
        <Button asChild className="w-full">
          <Link href="/dashboard/jefe">Volver al home</Link>
        </Button>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          name="title"
          placeholder="Pintar una habitación"
          value={formState.title}
          onChange={(event) => updateField('title', event.target.value)}
        />
        <FieldError messages={fieldErrors.title} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Categoría</Label>
        <select
          id="category"
          name="category"
          className="flex h-14 w-full rounded-[18px] border border-input bg-background px-4 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={formState.category}
          onChange={(event) => updateField('category', event.target.value)}
        >
          {workerCategorySlugs.map((category) => (
            <option key={category} value={category}>
              {workerCategoryLabels[category as WorkerCategorySlug]}
            </option>
          ))}
        </select>
        <FieldError messages={fieldErrors.category} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <textarea
          id="description"
          name="description"
          className="min-h-32 w-full rounded-[18px] border border-input bg-background px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="Contá qué necesitás, medidas aproximadas y cualquier detalle útil."
          value={formState.description}
          onChange={(event) => updateField('description', event.target.value)}
        />
        <FieldError messages={fieldErrors.description} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="addressText">Ubicación</Label>
        <Input
          id="addressText"
          name="addressText"
          placeholder="Salta Capital"
          value={formState.addressText}
          onChange={(event) => updateField('addressText', event.target.value)}
        />
        <FieldError messages={fieldErrors.addressText} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="desiredTime">Horario deseado</Label>
        <Input
          id="desiredTime"
          name="desiredTime"
          type="datetime-local"
          value={formState.desiredTime}
          onChange={(event) => updateField('desiredTime', event.target.value)}
        />
        <FieldError messages={fieldErrors.desiredTime} />
      </div>

      <div className="rounded-[24px] border border-dashed border-border bg-muted/40 p-5">
        <p className="text-sm font-bold text-foreground">Fotos opcionales</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          La UI queda preparada; la carga real de fotos del trabajo entra en una etapa de storage aparte.
        </p>
      </div>

      <FieldError messages={fieldErrors.form} />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Publicando...' : 'Publicar y recibir ofertas'}
      </Button>
    </form>
  );
}
