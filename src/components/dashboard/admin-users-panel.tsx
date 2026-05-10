'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Ban, Eye, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardAdminData } from '@/lib/dashboard-admin';

type UserStatus = DashboardAdminData['users'][number]['status'];

type AdminUsersPanelProps = {
  users: DashboardAdminData['users'];
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

export function AdminUsersPanel({ users: initialUsers }: AdminUsersPanelProps) {
  const [users, setUsers] = useState(initialUsers);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function updateUserStatus(userId: string, nextStatus: UserStatus) {
    setStatusMessage(null);
    setErrorMessage(null);
    const reason =
      nextStatus === 'ACTIVE'
        ? null
        : window.prompt('Motivo operativo')?.trim() ?? '';

    if (nextStatus !== 'ACTIVE' && (reason ?? '').length < 8) {
      setErrorMessage('El motivo debe tener al menos 8 caracteres.');
      return;
    }

    if (!window.confirm(`Confirmar cambio de usuario a ${nextStatus}`)) {
      return;
    }

    setBusyKey(`user:${userId}`);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          reason
        })
      });
      const payload = await readPayload(response);

      if (!response.ok) {
        setErrorMessage(readError(payload, 'No pudimos actualizar el usuario.'));
        return;
      }

      const updatedUser = (payload as { user?: DashboardAdminData['users'][number] } | null)?.user;

      if (updatedUser) {
        setUsers((current) => current.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
      }

      setStatusMessage('Usuario actualizado.');
    } catch {
      setErrorMessage('No pudimos actualizar el usuario.');
    } finally {
      setBusyKey(null);
    }
  }

  async function deleteUser(userId: string, label: string) {
    setStatusMessage(null);
    setErrorMessage(null);

    const reason = window.prompt('Motivo operativo del borrado definitivo')?.trim() ?? '';

    if (reason.length < 8) {
      setErrorMessage('El motivo debe tener al menos 8 caracteres.');
      return;
    }

    if (
      !window.confirm(
        `Confirmar borrado definitivo de ${label}. Se elimina el usuario local, sus datos asociados y su usuario de Supabase Auth.`
      )
    ) {
      return;
    }

    setBusyKey(`delete:${userId}`);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const payload = await readPayload(response);

      if (!response.ok) {
        setErrorMessage(readError(payload, 'No pudimos borrar el usuario.'));
        return;
      }

      setUsers((current) => current.filter((user) => user.id !== userId));
      setStatusMessage('Usuario borrado definitivamente.');
    } catch {
      setErrorMessage('No pudimos borrar el usuario.');
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <section className="space-y-6" aria-labelledby="admin-users-title">
      <div className="rounded-lg border border-border/70 bg-card/90 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Administración</p>
        <h2 id="admin-users-title" className="font-display text-3xl text-foreground">
          Usuarios
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">Estados operativos, roles y acceso a inspección completa.</p>
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
          <CardTitle className="font-display text-2xl">Listado</CardTitle>
          <CardDescription>{users.length} usuarios registrados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="rounded-lg border border-border/70 bg-background/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{user.displayName ?? user.email}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Badge variant={user.status === 'ACTIVE' ? 'secondary' : 'outline'}>{user.status}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {user.roles.map((role) => (
                  <Badge key={role.slug} variant="outline">
                    {role.slug}
                  </Badge>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild type="button" size="sm" variant="outline">
                  <Link href={`/dashboard/admin/usuarios/${user.id}` as Route}>
                    <Eye size={16} aria-hidden="true" />
                    Ver
                  </Link>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busyKey === `user:${user.id}` || user.status === 'ACTIVE'}
                  onClick={() => updateUserStatus(user.id, 'ACTIVE')}
                >
                  <RotateCcw size={16} aria-hidden="true" />
                  Activar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busyKey === `user:${user.id}` || user.status === 'SUSPENDED'}
                  onClick={() => updateUserStatus(user.id, 'SUSPENDED')}
                >
                  <Ban size={16} aria-hidden="true" />
                  Suspender
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busyKey === `user:${user.id}` || user.status === 'BLOCKED'}
                  onClick={() => updateUserStatus(user.id, 'BLOCKED')}
                >
                  <Ban size={16} aria-hidden="true" />
                  Bloquear
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={busyKey === `delete:${user.id}`}
                  onClick={() => deleteUser(user.id, user.displayName ?? user.email)}
                >
                  <Trash2 size={16} aria-hidden="true" />
                  Borrar
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
