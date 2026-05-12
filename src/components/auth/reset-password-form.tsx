'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/utils/supabase/client';

type ResetPasswordFormProps = {
  configured: boolean;
  authError?: string;
};

export function ResetPasswordForm({ configured, authError }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(authError ?? null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);

    if (!configured) {
      setErrorMessage('Supabase no está configurado en este entorno.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setErrorMessage(
          'No pudimos actualizar la contraseña. Abrí de nuevo el enlace de recuperación o pedí uno nuevo.'
        );
        return;
      }

      setPassword('');
      setConfirmPassword('');
      setStatusMessage('Contraseña actualizada. Ya podés seguir usando Yavaa.');
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-normal text-foreground">Nueva contraseña</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Elegí una contraseña nueva para completar la recuperación de tu cuenta.
        </p>
      </div>

      {!configured ? (
        <p className="rounded-[18px] border border-border/70 bg-muted/40 px-4 py-3 text-sm leading-6 text-muted-foreground">
          Supabase todavía no está configurado. El cambio de contraseña queda activo cuando estén
          listas las variables de entorno.
        </p>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña nueva</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirmar contraseña</Label>
          <Input
            id="confirm-password"
            name="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repetí la contraseña"
          />
        </div>

        {errorMessage ? (
          <p
            className="rounded-[18px] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive"
            data-testid="reset-password-error"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        {statusMessage ? (
          <p
            className="rounded-[18px] border border-border/70 bg-muted/40 px-4 py-3 text-sm leading-6 text-muted-foreground"
            role="status"
          >
            {statusMessage}
          </p>
        ) : null}

        <Button className="w-full" type="submit" disabled={!configured || isSubmitting}>
          {isSubmitting ? 'Actualizando...' : 'Actualizar contraseña'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          className="font-bold text-foreground underline underline-offset-4"
          href={'/dashboard' as Route}
        >
          Ir al panel
        </Link>
      </p>
    </div>
  );
}
