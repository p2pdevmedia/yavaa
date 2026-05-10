'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export const PUBLIC_EMERGENCY_DRAFT_STORAGE_KEY = 'yavaa.publicEmergencyDraft.v1';

type PublicEmergencyDraft = {
  category: string;
  address: string;
  description: string;
  contactPhone: string;
};

const emptyDraft: PublicEmergencyDraft = {
  category: '',
  address: '',
  description: '',
  contactPhone: ''
};

const emergencySignInPath = '/sign-in?next=%2Fdashboard%2Fjefe%2Furgencias';
const emergencySignUpPath = '/sign-up?next=%2Fdashboard%2Fjefe%2Furgencias';

function parseStoredDraft(value: string | null): PublicEmergencyDraft {
  if (!value) {
    return emptyDraft;
  }

  try {
    const parsed = JSON.parse(value) as Partial<PublicEmergencyDraft>;

    return {
      category: typeof parsed.category === 'string' ? parsed.category : '',
      address: typeof parsed.address === 'string' ? parsed.address : '',
      description: typeof parsed.description === 'string' ? parsed.description : '',
      contactPhone: typeof parsed.contactPhone === 'string' ? parsed.contactPhone : ''
    };
  } catch {
    return emptyDraft;
  }
}

export function PublicEmergencyDraftForm() {
  const [draft, setDraft] = useState<PublicEmergencyDraft>(emptyDraft);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setDraft(parseStoredDraft(localStorage.getItem(PUBLIC_EMERGENCY_DRAFT_STORAGE_KEY)));
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    localStorage.setItem(PUBLIC_EMERGENCY_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  function updateDraft(field: keyof PublicEmergencyDraft, value: string) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    localStorage.setItem(PUBLIC_EMERGENCY_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    setStatus('Guardamos tu urgencia. Inicia sesion para enviarla como Jefe.');
    window.location.assign(emergencySignInPath);
  }

  return (
    <Card className="border-border/70 bg-card/95 shadow-soft">
      <CardHeader>
        <CardTitle className="font-display text-3xl">Publicar una urgencia</CardTitle>
        <CardDescription>
          Podes completar el pedido ahora. Antes de enviarlo te pedimos iniciar sesion o crear cuenta, sin perder lo escrito.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="category">Tipo de trabajo</Label>
            <Input
              id="category"
              name="category"
              value={draft.category}
              onChange={(event) => updateDraft('category', event.target.value)}
              placeholder="Plomeria, electricidad, limpieza..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Direccion o propiedad</Label>
            <Input
              id="address"
              name="address"
              value={draft.address}
              onChange={(event) => updateDraft('address', event.target.value)}
              placeholder="Calle, barrio o referencia"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Que esta pasando?</Label>
            <Textarea
              id="description"
              name="description"
              value={draft.description}
              onChange={(event) => updateDraft('description', event.target.value)}
              placeholder="Contanos el problema, riesgos y horarios posibles."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">Telefono de contacto</Label>
            <Input
              id="contactPhone"
              name="contactPhone"
              value={draft.contactPhone}
              onChange={(event) => updateDraft('contactPhone', event.target.value)}
              placeholder="+54 9 ..."
            />
          </div>

          {status ? (
            <p className="rounded-[8px] border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              {status}
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <Button type="submit">Iniciar sesión para enviar</Button>
            <Button asChild type="button" variant="outline">
              <Link href={emergencySignUpPath}>Crear cuenta y enviar</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
