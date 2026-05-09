'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/utils/supabase/client';

type AuthMode = 'sign-in' | 'sign-up';

type AuthFormProps = {
  mode: AuthMode;
  nextPath: string;
  configured: boolean;
};

const copyByMode: Record<
  AuthMode,
  {
    title: string;
    description: string;
    submitLabel: string;
    alternateLabel: string;
    alternateHref: Route;
  }
> = {
  'sign-in': {
    title: 'Iniciar sesión',
    description: 'Entrá con tu correo y contraseña para acceder al área protegida.',
    submitLabel: 'Ingresar',
    alternateLabel: 'Crear cuenta',
    alternateHref: '/sign-up' as Route
  },
  'sign-up': {
    title: 'Crear cuenta',
    description: 'Registrate con correo y contraseña para activar tu acceso a Yavaa.',
    submitLabel: 'Registrar cuenta',
    alternateLabel: 'Ya tengo cuenta',
    alternateHref: '/sign-in' as Route
  }
};

function getAuthErrorMessage(error: { code?: string; message: string }) {
  if (error.code === 'over_email_send_rate_limit') {
    return 'Supabase bloqueó el registro porque se superó el límite de emails de confirmación. Esperá a que se reinicie el límite o configurá un SMTP propio en Supabase Auth.';
  }

  return error.message;
}

export function AuthForm({ mode, nextPath, configured }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const copy = copyByMode[mode];

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

      if (mode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          setErrorMessage(getAuthErrorMessage(error));
          return;
        }

        startTransition(() => {
          router.push(nextPath as Route);
          router.refresh();
        });
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${nextPath}`
        }
      });

      if (error) {
        setErrorMessage(getAuthErrorMessage(error));
        return;
      }

      if (data.session) {
        startTransition(() => {
          router.push(nextPath as Route);
          router.refresh();
        });
        return;
      }

      setStatusMessage('Te enviamos un correo para confirmar tu cuenta. Después podés ingresar.');
      setPassword('');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{copy.title}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{copy.description}</p>
      </div>

      {!configured ? (
        <p className="rounded-lg border border-border/70 bg-muted/40 px-4 py-3 text-sm leading-6 text-muted-foreground">
          Supabase todavía no está configurado. Cuando agregues las variables de entorno, este
          formulario queda activo sin cambios de código.
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

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        {errorMessage ? (
          <p
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive"
            data-testid="auth-error"
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

        <Button className="w-full" type="submit" disabled={!configured || isSubmitting || isPending}>
          {isSubmitting || isPending ? 'Procesando...' : copy.submitLabel}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        {mode === 'sign-in' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
        <Link className="font-medium text-foreground underline underline-offset-4" href={copy.alternateHref}>
          {copy.alternateLabel}
        </Link>
      </p>
    </div>
  );
}
