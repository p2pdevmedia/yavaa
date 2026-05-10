'use client';

import { Ban, Check } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardAdminData } from '@/lib/dashboard-admin';

type ContractorStatus = DashboardAdminData['contractorProfiles'][number]['approvalStatus'];

type AdminContractorsPanelProps = {
  contractorProfiles: DashboardAdminData['contractorProfiles'];
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

export function AdminContractorsPanel({ contractorProfiles: initialProfiles }: AdminContractorsPanelProps) {
  const [contractorProfiles, setContractorProfiles] = useState(initialProfiles);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function reviewContractor(
    contractorProfileId: string,
    approvalStatus: Extract<ContractorStatus, 'APPROVED' | 'REJECTED'>
  ) {
    setStatusMessage(null);
    setErrorMessage(null);
    const reviewNotes = window.prompt('Nota de revisión')?.trim() ?? null;

    if (!window.confirm(`Confirmar contractor ${approvalStatus}`)) {
      return;
    }

    setBusyKey(`contractor:${contractorProfileId}`);

    try {
      const response = await fetch(`/api/admin/contractors/${contractorProfileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalStatus,
          reviewNotes
        })
      });
      const payload = await readPayload(response);

      if (!response.ok) {
        setErrorMessage(readError(payload, 'No pudimos revisar el contractor.'));
        return;
      }

      const reviewed = (payload as {
        contractorProfile?: Pick<
          DashboardAdminData['contractorProfiles'][number],
          'id' | 'approvalStatus' | 'reviewNotes' | 'reviewedAt' | 'reviewedByUserId'
        >;
      } | null)?.contractorProfile;

      if (reviewed) {
        setContractorProfiles((current) =>
          current.map((profile) => (profile.id === reviewed.id ? { ...profile, ...reviewed } : profile))
        );
      }

      setStatusMessage('Contractor revisado.');
    } catch {
      setErrorMessage('No pudimos revisar el contractor.');
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <section className="space-y-6" aria-labelledby="admin-contractors-title">
      <div className="rounded-lg border border-border/70 bg-card/90 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Administración</p>
        <h2 id="admin-contractors-title" className="font-display text-3xl text-foreground">
          Contractors
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">Revisión operativa de perfiles de trabajadores.</p>
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
          <CardTitle className="font-display text-2xl">Perfiles</CardTitle>
          <CardDescription>{contractorProfiles.length} perfiles encontrados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {contractorProfiles.map((profile) => (
            <div key={profile.id} className="rounded-lg border border-border/70 bg-background/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{profile.user.displayName ?? profile.user.email}</p>
                  <p className="text-sm text-muted-foreground">
                    {profile.categories.map((category) => category.name).join(', ') || 'Sin categorías'}
                  </p>
                </div>
                <Badge variant={profile.approvalStatus === 'APPROVED' ? 'secondary' : 'outline'}>
                  {profile.approvalStatus}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Enviado: {formatDate(profile.submittedAt)} · Usuario {profile.user.status}
              </p>
              {profile.reviewNotes ? (
                <p className="mt-2 text-sm text-muted-foreground">{profile.reviewNotes}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busyKey === `contractor:${profile.id}` || profile.approvalStatus !== 'PENDING_REVIEW'}
                  onClick={() => reviewContractor(profile.id, 'APPROVED')}
                >
                  <Check size={16} aria-hidden="true" />
                  Aprobar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busyKey === `contractor:${profile.id}` || profile.approvalStatus !== 'PENDING_REVIEW'}
                  onClick={() => reviewContractor(profile.id, 'REJECTED')}
                >
                  <Ban size={16} aria-hidden="true" />
                  Rechazar
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
