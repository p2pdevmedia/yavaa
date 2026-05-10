'use client';

import { Ban } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardAdminData } from '@/lib/dashboard-admin';

type AdminBookingsPanelProps = {
  bookings: DashboardAdminData['bookings'];
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

function formatDate(value: string | null): string {
  if (!value) {
    return 'sin fecha';
  }

  return `${value.slice(0, 10)} ${value.slice(11, 16)} UTC`;
}

export function AdminBookingsPanel({ bookings: initialBookings }: AdminBookingsPanelProps) {
  const [bookings, setBookings] = useState(initialBookings);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function cancelBooking(bookingId: string) {
    setStatusMessage(null);
    setErrorMessage(null);
    const reason = window.prompt('Motivo de cancelación')?.trim() ?? '';

    if (reason.length < 8) {
      setErrorMessage('El motivo debe tener al menos 8 caracteres.');
      return;
    }

    if (!window.confirm('Confirmar cancelación admin del booking')) {
      return;
    }

    setBusyKey(`booking:${bookingId}`);

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/correction`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          reason
        })
      });
      const payload = await readPayload(response);

      if (!response.ok) {
        setErrorMessage(readError(payload, 'No pudimos corregir el booking.'));
        return;
      }

      const booking = (payload as { booking?: DashboardAdminData['bookings'][number] } | null)?.booking;

      if (booking) {
        setBookings((current) => current.map((item) => (item.id === booking.id ? booking : item)));
      }

      setStatusMessage('Booking corregido.');
    } catch {
      setErrorMessage('No pudimos corregir el booking.');
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <section className="space-y-6" aria-labelledby="admin-bookings-title">
      <div className="rounded-lg border border-border/70 bg-card/90 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Administración</p>
        <h2 id="admin-bookings-title" className="font-display text-3xl text-foreground">
          Bookings conflictivos
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">Correcciones operativas con trazabilidad.</p>
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
          <CardTitle className="font-display text-2xl">Intervenciones</CardTitle>
          <CardDescription>{bookings.length} bookings visibles para operación.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {bookings.map((booking) => (
            <div key={booking.id} className="rounded-lg border border-border/70 bg-background/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{booking.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.client.displayName ?? booking.client.email} ·{' '}
                    {booking.contractorProfile.user.displayName ?? booking.contractorProfile.user.email}
                  </p>
                </div>
                <Badge variant={booking.status === 'ACCEPTED' ? 'secondary' : 'outline'}>{booking.status}</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {booking.category.name} · {formatDate(booking.scheduledFor)}
              </p>
              <div className="mt-4">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={
                    busyKey === `booking:${booking.id}` ||
                    !['PENDING_ACCEPTANCE', 'ACCEPTED', 'RESCHEDULE_REQUESTED'].includes(booking.status)
                  }
                  onClick={() => cancelBooking(booking.id)}
                >
                  <Ban size={16} aria-hidden="true" />
                  Cancelar
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
