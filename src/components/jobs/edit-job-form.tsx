'use client';

import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { Route } from 'next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { JobPostApiSummary } from '@/lib/job-posts';
import { workerCategoryLabels, workerCategorySlugs, type WorkerCategorySlug } from '@/lib/onboarding';

type EditJobFormState = {
  title: string;
  category: string;
  description: string;
  addressText: string;
  desiredDate: string;
  desiredClockTime: string;
  desiredTime: string;
};

type EditJobResponse =
  | {
      ok: true;
      jobPost: JobPostApiSummary;
    }
  | {
      ok: false;
      message?: string;
      fieldErrors?: Partial<Record<keyof EditJobFormState, string[]>>;
    };

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

function formatDateValue(date: Date): string {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function formatTimeValue(date: Date): string {
  return `${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;
}

function buildDesiredTimeIso(dateValue: string, timeValue: string): string {
  const [year, month, day] = dateValue.split('-').map(Number);
  const [hour, minute] = timeValue.split(':').map(Number);

  return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString();
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }

  return <p className="text-sm font-semibold text-destructive">{messages[0]}</p>;
}

export function EditJobForm({ jobPost }: { jobPost: JobPostApiSummary }) {
  const todayDate = useMemo(() => formatDateValue(new Date()), []);
  const initialDesiredTime = jobPost.desiredTime ? new Date(jobPost.desiredTime) : null;
  const [formState, setFormState] = useState<EditJobFormState>({
    title: jobPost.title,
    category: jobPost.category,
    description: jobPost.description,
    addressText: jobPost.addressText,
    desiredDate: initialDesiredTime ? formatDateValue(initialDesiredTime) : '',
    desiredClockTime: initialDesiredTime ? formatTimeValue(initialDesiredTime) : '',
    desiredTime: initialDesiredTime ? initialDesiredTime.toISOString() : ''
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof EditJobFormState | 'form', string[]>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatedJobPost, setUpdatedJobPost] = useState<JobPostApiSummary | null>(null);

  const payload = useMemo(
    () => ({
      title: formState.title,
      category: formState.category,
      description: formState.description,
      addressText: formState.addressText,
      ...(formState.desiredTime ? { desiredTime: formState.desiredTime } : {})
    }),
    [formState.addressText, formState.category, formState.description, formState.desiredTime, formState.title]
  );

  function updateField(field: keyof EditJobFormState, value: string) {
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

  function updateSchedule(nextDate: string, nextClockTime: string) {
    setFormState((current) => ({
      ...current,
      desiredDate: nextDate,
      desiredClockTime: nextClockTime,
      desiredTime: nextDate && nextClockTime ? buildDesiredTimeIso(nextDate, nextClockTime) : ''
    }));
    setFieldErrors((current) => ({
      ...current,
      desiredTime: undefined,
      form: undefined
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if ((formState.desiredDate || formState.desiredClockTime) && !formState.desiredTime) {
      setFieldErrors({
        desiredTime: ['Elegí fecha y hora o dejalo vacío.']
      });
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});

    try {
      const response = await fetch(`/api/job-posts/${jobPost.id}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const responseBody = (await response.json()) as EditJobResponse;

      if (!response.ok || !responseBody.ok) {
        setFieldErrors(
          !responseBody.ok && responseBody.fieldErrors
            ? responseBody.fieldErrors
            : {
                form: [!responseBody.ok && responseBody.message ? responseBody.message : 'No pudimos editar el trabajo.']
              }
        );
        return;
      }

      setUpdatedJobPost(responseBody.jobPost);
    } catch {
      setFieldErrors({
        form: ['No pudimos conectar con Yavaa. Probá de nuevo.']
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (updatedJobPost) {
    return (
      <section className="space-y-5 rounded-[28px] border border-border bg-card p-6 shadow-soft">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Trabajo actualizado</p>
        <h1 className="font-display text-3xl font-bold tracking-normal text-foreground">{updatedJobPost.title}</h1>
        <p className="text-sm leading-6 text-muted-foreground">Los cambios ya quedaron guardados.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button asChild variant="outline">
            <Link href={'/dashboard/jefe' as Route}>Volver al home</Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/jefe/trabajos/${updatedJobPost.id}` as Route}>Ver trabajo</Link>
          </Button>
        </div>
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
          value={formState.addressText}
          onChange={(event) => updateField('addressText', event.target.value)}
        />
        <FieldError messages={fieldErrors.addressText} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="desiredDate">Fecha y hora</Label>
        <div className="grid grid-cols-[minmax(0,1fr)_8rem] gap-2">
          <Input
            id="desiredDate"
            name="desiredDate"
            type="date"
            min={todayDate}
            value={formState.desiredDate}
            onChange={(event) => updateSchedule(event.target.value, formState.desiredClockTime)}
          />
          <Input
            id="desiredClockTime"
            name="desiredClockTime"
            type="time"
            step={60}
            value={formState.desiredClockTime}
            onChange={(event) => updateSchedule(formState.desiredDate, event.target.value)}
          />
        </div>
        <FieldError messages={fieldErrors.desiredTime} />
      </div>

      <FieldError messages={fieldErrors.form} />

      <div className="grid gap-2 sm:grid-cols-2">
        <Button asChild variant="outline">
          <Link href={`/dashboard/jefe/trabajos/${jobPost.id}` as Route}>Cancelar</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}
