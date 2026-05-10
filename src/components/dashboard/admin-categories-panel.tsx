'use client';

import { Pencil, Save, Trash2, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { DashboardAdminData } from '@/lib/dashboard-admin';

type CategoryStatus = DashboardAdminData['categories'][number]['status'];

type CategoryDraft = {
  slug: string;
  name: string;
  group: string;
  status: CategoryStatus;
};

type AdminCategoriesPanelProps = {
  categories: DashboardAdminData['categories'];
};

function readError(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    const message = 'message' in payload ? payload.message : null;
    const error = 'error' in payload ? payload.error : null;

    if (typeof message === 'string') {
      return message;
    }

    if (typeof error === 'string') {
      return error;
    }
  }

  return fallback;
}

async function readPayload(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function buildDraft(category: DashboardAdminData['categories'][number]): CategoryDraft {
  return {
    slug: category.slug,
    name: category.name,
    group: category.group ?? '',
    status: category.status
  };
}

const emptyDraft: CategoryDraft = {
  slug: '',
  name: '',
  group: '',
  status: 'PENDING_REVIEW'
};

export function AdminCategoriesPanel({ categories: initialCategories }: AdminCategoriesPanelProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft>(emptyDraft);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<CategoryDraft>(emptyDraft);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  function clearFeedback() {
    setStatusMessage(null);
    setErrorMessage(null);
  }

  async function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    setBusyKey('category:create');

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: categoryDraft.slug,
          name: categoryDraft.name,
          group: categoryDraft.group || null,
          status: categoryDraft.status
        })
      });
      const payload = await readPayload(response);

      if (!response.ok) {
        setErrorMessage(readError(payload, 'No pudimos guardar la categoría.'));
        return;
      }

      const category = (payload as { category?: DashboardAdminData['categories'][number] } | null)?.category;

      if (category) {
        setCategories((current) => {
          const exists = current.some((item) => item.id === category.id);
          return exists
            ? current.map((item) => (item.id === category.id ? category : item))
            : [...current, category].sort((left, right) => left.name.localeCompare(right.name));
        });
        setCategoryDraft(emptyDraft);
      }

      setStatusMessage('Categoría guardada.');
    } catch {
      setErrorMessage('No pudimos guardar la categoría.');
    } finally {
      setBusyKey(null);
    }
  }

  async function updateCategory(categoryId: string, draft: CategoryDraft) {
    clearFeedback();
    setBusyKey(`category:${categoryId}`);

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: draft.slug,
          name: draft.name,
          group: draft.group || null,
          status: draft.status
        })
      });
      const payload = await readPayload(response);

      if (!response.ok) {
        setErrorMessage(readError(payload, 'No pudimos actualizar la categoría.'));
        return;
      }

      const updatedCategory = (payload as { category?: DashboardAdminData['categories'][number] } | null)?.category;

      if (updatedCategory) {
        setCategories((current) => current.map((item) => (item.id === updatedCategory.id ? updatedCategory : item)));
      }

      setEditId(null);
      setStatusMessage('Categoría actualizada.');
    } catch {
      setErrorMessage('No pudimos actualizar la categoría.');
    } finally {
      setBusyKey(null);
    }
  }

  async function deleteCategory(category: DashboardAdminData['categories'][number]) {
    clearFeedback();

    if (!window.confirm(`Borrar la categoría ${category.name}. Si está en uso, el sistema lo va a bloquear.`)) {
      return;
    }

    setBusyKey(`category:${category.id}`);

    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'DELETE'
      });
      const payload = await readPayload(response);

      if (!response.ok) {
        setErrorMessage(readError(payload, 'No pudimos borrar la categoría. Si ya tiene uso, inactivala.'));
        return;
      }

      setCategories((current) => current.filter((item) => item.id !== category.id));
      setStatusMessage('Categoría borrada.');
    } catch {
      setErrorMessage('No pudimos borrar la categoría.');
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <section className="space-y-6" aria-labelledby="admin-categories-title">
      <div className="rounded-lg border border-border/70 bg-card/90 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Administración</p>
        <h2 id="admin-categories-title" className="font-display text-3xl text-foreground">
          Categorías
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Catálogo moderado: crear, editar, inactivar y borrar solo cuando no haya historial asociado.
        </p>
      </div>

      {errorMessage ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}

      {statusMessage ? (
        <p className="rounded-lg border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {statusMessage}
        </p>
      ) : null}

      <Card className="border-border/70 bg-card/90 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Nueva categoría</CardTitle>
          <CardDescription>Las nuevas categorías quedan en revisión salvo que indiques otro estado.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submitCategory}>
            <CategoryFields draft={categoryDraft} onChange={setCategoryDraft} idPrefix="admin-category-new" />
            <Button type="submit" size="sm" disabled={busyKey === 'category:create'}>
              <Save size={16} aria-hidden="true" />
              Guardar categoría
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Categorías existentes</CardTitle>
          <CardDescription>{categories.length} categorías configuradas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {categories.map((category) => {
            const isEditing = editId === category.id;

            return (
              <div key={category.id} className="rounded-lg border border-border/70 bg-background/60 p-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <CategoryFields draft={editDraft} onChange={setEditDraft} idPrefix={`admin-category-${category.id}`} />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={busyKey === `category:${category.id}`}
                        onClick={() => updateCategory(category.id, editDraft)}
                      >
                        <Save size={16} aria-hidden="true" />
                        Guardar cambios
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => setEditId(null)}>
                        <X size={16} aria-hidden="true" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{category.name}</p>
                        <p className="text-sm text-muted-foreground">{category.slug}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{category.group ?? 'Sin grupo'}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{category.status}</Badge>
                        {category.isInitial ? <Badge variant="secondary">Inicial</Badge> : null}
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditId(category.id);
                          setEditDraft(buildDraft(category));
                        }}
                      >
                        <Pencil size={16} aria-hidden="true" />
                        Editar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busyKey === `category:${category.id}` || category.isInitial}
                        onClick={() => deleteCategory(category)}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                        Borrar
                      </Button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}

function CategoryFields({
  draft,
  onChange,
  idPrefix
}: {
  draft: CategoryDraft;
  onChange: (draft: CategoryDraft) => void;
  idPrefix: string;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-slug`}>Slug</Label>
          <Input
            id={`${idPrefix}-slug`}
            value={draft.slug}
            onChange={(event) => onChange({ ...draft, slug: event.target.value })}
            placeholder="pet-care"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-name`}>Nombre</Label>
          <Input
            id={`${idPrefix}-name`}
            value={draft.name}
            onChange={(event) => onChange({ ...draft, name: event.target.value })}
            placeholder="Pet Care"
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-group`}>Grupo</Label>
          <Input
            id={`${idPrefix}-group`}
            value={draft.group}
            onChange={(event) => onChange({ ...draft, group: event.target.value })}
            placeholder="home services"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-status`}>Estado</Label>
          <select
            id={`${idPrefix}-status`}
            className="flex h-11 w-full rounded-lg border border-input bg-card px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            value={draft.status}
            onChange={(event) => onChange({ ...draft, status: event.target.value as CategoryStatus })}
          >
            <option value="PENDING_REVIEW">PENDING_REVIEW</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
      </div>
    </>
  );
}
