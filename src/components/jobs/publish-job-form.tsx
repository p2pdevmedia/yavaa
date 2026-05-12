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
  desiredDate: string;
  desiredTimeSlot: string;
  desiredTime: string;
};

const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'] as const;

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

type DateOption = {
  value: string;
  label: string;
  detail: string;
};

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

function formatDateValue(date: Date): string {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function buildDateOptions(today: Date): DateOption[] {
  const formatter = new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  return [0, 1, 2, 3].map((offset) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + offset);

    return {
      value: formatDateValue(date),
      label: offset === 0 ? 'Hoy' : offset === 1 ? 'Mañana' : formatter.format(date),
      detail: formatter.format(date)
    };
  });
}

function buildDesiredTimeIso(dateValue: string, timeValue: string): string {
  const [year, month, day] = dateValue.split('-').map(Number);
  const [hour, minute] = timeValue.split(':').map(Number);

  return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString();
}

function isPastTimeSlot(dateValue: string, timeValue: string, now: Date): boolean {
  return new Date(buildDesiredTimeIso(dateValue, timeValue)).getTime() <= now.getTime();
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }

  return <p className="text-sm font-semibold text-destructive">{messages[0]}</p>;
}

export function PublishJobForm({ initialAddress = '' }: { initialAddress?: string | null }) {
  const now = useMemo(() => new Date(), []);
  const dateOptions = useMemo(() => buildDateOptions(now), [now]);
  const defaultDate = dateOptions[1]?.value ?? dateOptions[0]?.value ?? '';
  const [formState, setFormState] = useState<PublishJobFormState>({
    title: '',
    category: 'cleaning',
    description: '',
    addressText: initialAddress ?? '',
    desiredDate: '',
    desiredTimeSlot: '',
    desiredTime: ''
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof PublishJobFormState | 'form', string[]>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishedTitle, setPublishedTitle] = useState<string | null>(null);
  const selectedDate = formState.desiredDate || defaultDate;

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

  function updateSchedule(nextDate: string, nextTimeSlot: string) {
    setFormState((current) => ({
      ...current,
      desiredDate: nextDate,
      desiredTimeSlot: nextTimeSlot,
      desiredTime: nextDate && nextTimeSlot ? buildDesiredTimeIso(nextDate, nextTimeSlot) : ''
    }));
    setFieldErrors((current) => ({
      ...current,
      desiredTime: undefined,
      form: undefined
    }));
  }

  function handleDateSelection(dateValue: string) {
    const nextTimeSlot =
      formState.desiredTimeSlot && !isPastTimeSlot(dateValue, formState.desiredTimeSlot, now)
        ? formState.desiredTimeSlot
        : '';

    updateSchedule(dateValue, nextTimeSlot);
  }

  function handleTimeSelection(timeSlot: string) {
    if (!selectedDate || isPastTimeSlot(selectedDate, timeSlot, now)) {
      return;
    }

    updateSchedule(selectedDate, timeSlot);
  }

  function clearSchedule() {
    updateSchedule(selectedDate, '');
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
        <Label>Horario deseado</Label>
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Elegir día">
          {dateOptions.map((dateOption) => {
            const isSelected = selectedDate === dateOption.value;

            return (
              <Button
                key={dateOption.value}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                className="h-auto min-w-24 flex-col items-start rounded-[18px] px-4 py-3"
                onClick={() => handleDateSelection(dateOption.value)}
              >
                <span>{dateOption.label}</span>
                <span className="text-xs font-semibold opacity-75">{dateOption.detail}</span>
              </Button>
            );
          })}
        </div>
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Elegir hora">
          {timeSlots.map((timeSlot) => {
            const isDisabled = !selectedDate || isPastTimeSlot(selectedDate, timeSlot, now);
            const isSelected = formState.desiredTimeSlot === timeSlot && Boolean(formState.desiredTime);

            return (
              <Button
                key={timeSlot}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                className="h-12 rounded-[16px] px-3"
                disabled={isDisabled}
                onClick={() => handleTimeSelection(timeSlot)}
              >
                {timeSlot}
              </Button>
            );
          })}
        </div>
        <Button type="button" variant={!formState.desiredTime ? 'default' : 'outline'} onClick={clearSchedule}>
          Sin horario
        </Button>
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
