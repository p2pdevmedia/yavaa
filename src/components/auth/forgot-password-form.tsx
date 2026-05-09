'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { buildPasswordResetRedirectTo } from '@/lib/auth-redirect';
import { createClient } from '@/utils/supabase/client';

type ForgotPasswordFormProps = {
  configured: boolean;
  authError?: string;
};

function getPasswordResetErrorMessage(error: { code?: string; message: string }) {
  if (error.code === 'over_email_send_rate_limit') {
    return 'Supabase bloqueó temporalmente el envío de emails. Esperá a que se reinicie el límite o configurá un SMTP propio en Supabase Auth.';
  }

  return error.message;
}

export function ForgotPasswordForm({ configured, authError }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
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

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: buildPasswordResetRedirectTo(window.location.origin)
      });

      if (error) {
        setErrorMessage(getPasswordResetErrorMessage(error));
        return;
      }

      setStatusMessage(
        'Si existe una cuenta con ese correo, te enviamos un enlace para crear una nueva contraseña.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Recuperar contraseña</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Ingresá tu correo y te mandamos un enlace seguro para cambiarla.
        </p>
      </div>

      {!configured ? (
        <p className="rounded-lg border border-border/70 bg-muted/40 px-4 py-3 text-sm leading-6 text-muted-foreground">
          Supabase todavía no está configurado. El envío de recuperación queda activo cuando estén
          listas las variables de entorno.
        </p>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@email.com"
          />
        </div>

        {errorMessage ? (
          <p
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive"
            data-testid="forgot-password-error"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        {statusMessage ? (
          <p
            className="rounded-lg border border-border/70 bg-muted/40 px-4 py-3 text-sm leading-6 text-muted-foreground"
            role="status"
          >
            {statusMessage}
          </p>
        ) : null}

        <Button className="w-full" type="submit" disabled={!configured || isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Enviar enlace'}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        <Link className="font-medium text-foreground underline underline-offset-4" href="/sign-in">
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  );
}
