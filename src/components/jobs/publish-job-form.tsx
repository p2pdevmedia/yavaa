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
  desiredClockTime: string;
  desiredTime: string;
  photoPathnames: string[];
};

type JobPhotoPreview = {
  pathname: string;
  previewSrc: string;
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

type JobPhotoUploadResponse =
  | {
      ok: true;
      pathname: string;
      previewSrc: string;
    }
  | {
      ok: false;
      message?: string;
    };

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

function formatDateValue(date: Date): string {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
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

export function PublishJobForm({ initialAddress = '' }: { initialAddress?: string | null }) {
  const todayDate = useMemo(() => formatDateValue(new Date()), []);
  const [formState, setFormState] = useState<PublishJobFormState>({
    title: '',
    category: 'cleaning',
    description: '',
    addressText: initialAddress ?? '',
    desiredDate: '',
    desiredClockTime: '',
    desiredTime: '',
    photoPathnames: []
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof PublishJobFormState | 'form', string[]>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [publishedTitle, setPublishedTitle] = useState<string | null>(null);
  const [jobPhotos, setJobPhotos] = useState<JobPhotoPreview[]>([]);

  const payload = useMemo(
    () => ({
      title: formState.title,
      category: formState.category,
      description: formState.description,
      addressText: formState.addressText,
      ...(formState.desiredTime ? { desiredTime: formState.desiredTime } : {}),
      ...(formState.photoPathnames.length > 0 ? { photoPathnames: formState.photoPathnames } : {})
    }),
    [
      formState.addressText,
      formState.category,
      formState.description,
      formState.desiredTime,
      formState.photoPathnames,
      formState.title
    ]
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

  function handleDateSelection(dateValue: string) {
    updateSchedule(dateValue, formState.desiredClockTime);
  }

  function handleTimeSelection(clockTime: string) {
    updateSchedule(formState.desiredDate, clockTime);
  }

  function removeJobPhoto(pathname: string) {
    setJobPhotos((current) => current.filter((photo) => photo.pathname !== pathname));
    setFormState((current) => ({
      ...current,
      photoPathnames: current.photoPathnames.filter((currentPathname) => currentPathname !== pathname)
    }));
    setFieldErrors((current) => ({
      ...current,
      photoPathnames: undefined,
      form: undefined
    }));
  }

  async function uploadJobPhoto(file: File): Promise<JobPhotoPreview> {
    const formData = new FormData();
    formData.set('file', file);

    const response = await fetch('/api/job-posts/photos', {
      method: 'POST',
      body: formData
    });
    const responseBody = (await response.json()) as JobPhotoUploadResponse;

    if (!response.ok || !responseBody.ok) {
      throw new Error(!responseBody.ok && responseBody.message ? responseBody.message : 'No pudimos subir la foto.');
    }

    return {
      pathname: responseBody.pathname,
      previewSrc: responseBody.previewSrc
    };
  }

  async function handlePhotoFiles(files: FileList | null) {
    const selectedFiles = Array.from(files ?? []);

    if (selectedFiles.length === 0 || isUploadingPhoto) {
      return;
    }

    if (jobPhotos.length + selectedFiles.length > 6) {
      setFieldErrors((current) => ({
        ...current,
        photoPathnames: ['Usá 6 fotos o menos.']
      }));
      return;
    }

    setIsUploadingPhoto(true);
    setFieldErrors((current) => ({
      ...current,
      photoPathnames: undefined,
      form: undefined
    }));

    try {
      const uploadedPhotos: JobPhotoPreview[] = [];

      for (const file of selectedFiles) {
        uploadedPhotos.push(await uploadJobPhoto(file));
      }

      setJobPhotos((current) => [...current, ...uploadedPhotos]);
      setFormState((current) => ({
        ...current,
        photoPathnames: [...current.photoPathnames, ...uploadedPhotos.map((photo) => photo.pathname)]
      }));
    } catch (error) {
      setFieldErrors((current) => ({
        ...current,
        photoPathnames: [error instanceof Error ? error.message : 'No pudimos subir la foto.']
      }));
    } finally {
      setIsUploadingPhoto(false);
    }
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
        <Label htmlFor="desiredDate">Fecha y hora</Label>
        <div className="grid grid-cols-[minmax(0,1fr)_8rem] gap-2">
          <Input
            id="desiredDate"
            name="desiredDate"
            type="date"
            min={todayDate}
            value={formState.desiredDate}
            onChange={(event) => handleDateSelection(event.target.value)}
          />
          <Input
            id="desiredClockTime"
            name="desiredClockTime"
            type="time"
            step={60}
            value={formState.desiredClockTime}
            onChange={(event) => handleTimeSelection(event.target.value)}
          />
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          Opcional. Podés elegir cualquier mes y horario.
        </p>
        <FieldError messages={fieldErrors.desiredTime} />
      </div>

      <div className="rounded-[24px] border border-dashed border-border bg-muted/40 p-5">
        <p className="text-sm font-bold text-foreground">Fotos opcionales</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Sumá fotos privadas del lugar o del problema.</p>
        <label className="mt-4 inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-[16px] border border-input bg-background px-4 text-sm font-bold text-foreground">
          {isUploadingPhoto ? 'Subiendo...' : 'Subir o tomar fotos'}
          <input
            className="sr-only"
            name="jobPhotos"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            multiple
            disabled={isUploadingPhoto}
            onChange={(event) => {
              void handlePhotoFiles(event.currentTarget.files);
              event.currentTarget.value = '';
            }}
          />
        </label>
        {jobPhotos.length > 0 ? (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {jobPhotos.map((photo) => (
              <div key={photo.pathname} className="relative overflow-hidden rounded-[16px] border border-border bg-background">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.previewSrc} alt="Vista previa de foto del trabajo" className="aspect-square w-full object-cover" />
                <button
                  type="button"
                  className="absolute right-1 top-1 rounded-full bg-background/90 px-2 py-1 text-xs font-bold text-foreground"
                  onClick={() => removeJobPhoto(photo.pathname)}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <FieldError messages={fieldErrors.photoPathnames} />
      </div>

      <FieldError messages={fieldErrors.form} />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Publicando...' : 'Publicar y recibir ofertas'}
      </Button>
    </form>
  );
}
