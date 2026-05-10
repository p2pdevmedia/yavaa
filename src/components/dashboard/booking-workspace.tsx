'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type {
  DashboardBooking,
  DashboardBookingFile,
  DashboardBookingMessage
} from '@/lib/dashboard-workspace';

type BookingWorkspaceProps = {
  bookings: DashboardBooking[];
};

type ConversationPayload = {
  messages: DashboardBookingMessage[];
  files: DashboardBookingFile[];
};

type BookingFilePurpose = 'CHAT_ATTACHMENT' | 'PROBLEM_PHOTO' | 'PAYMENT_PROOF';

function formatDateTime(value: string): string {
  const date = new Date(value);
  return `${date.toISOString().slice(0, 10)} ${date.toISOString().slice(11, 16)} UTC`;
}

function getBookingTitle(booking: DashboardBooking): string {
  return booking.client.displayName ?? booking.client.email;
}

function getBookingSubtitle(booking: DashboardBooking): string {
  return `${booking.category.name} · ${booking.status}`;
}

function getMessageAuthor(message: DashboardBookingMessage): string {
  if (message.kind === 'SYSTEM') {
    return 'Sistema';
  }

  return message.senderUser?.displayName ?? message.senderUser?.email ?? 'Participante';
}

export function BookingWorkspace({ bookings }: BookingWorkspaceProps) {
  const [selectedBookingId, setSelectedBookingId] = useState<string>(() => bookings[0]?.id ?? '');
  const [conversation, setConversation] = useState<ConversationPayload>({ messages: [], files: [] });
  const [messageDraft, setMessageDraft] = useState('');
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendStatus, setSendStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [uploadPurpose, setUploadPurpose] = useState<BookingFilePurpose>('CHAT_ATTACHMENT');
  const [uploadInputKey, setUploadInputKey] = useState(0);

  const selectedBooking = useMemo(
    () => bookings.find((booking) => booking.id === selectedBookingId) ?? bookings[0] ?? null,
    [bookings, selectedBookingId]
  );
  const activeBookingId = selectedBooking?.id ?? '';

  useEffect(() => {
    if (!activeBookingId) {
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    async function loadConversation() {
      setIsLoadingConversation(true);
      setConversationError(null);

      try {
        const [messagesResponse, filesResponse] = await Promise.all([
          fetch(`/api/bookings/${activeBookingId}/messages`, { signal: controller.signal }),
          fetch(`/api/bookings/${activeBookingId}/files`, { signal: controller.signal })
        ]);

        if (!messagesResponse.ok || !filesResponse.ok) {
          throw new Error('conversation-load-failed');
        }

        const [messagesPayload, filesPayload] = (await Promise.all([
          messagesResponse.json(),
          filesResponse.json()
        ])) as [ConversationPayload, ConversationPayload];

        if (!isMounted) {
          return;
        }

        setConversation({
          messages: messagesPayload.messages ?? [],
          files: filesPayload.files ?? []
        });
      } catch {
        if (isMounted) {
          setConversation({ messages: [], files: [] });
          setConversationError('No pudimos cargar la conversación del booking.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingConversation(false);
        }
      }
    }

    void loadConversation();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [activeBookingId]);

  async function reloadConversation(bookingId: string) {
    const [messagesResponse, filesResponse] = await Promise.all([
      fetch(`/api/bookings/${bookingId}/messages`),
      fetch(`/api/bookings/${bookingId}/files`)
    ]);

    if (!messagesResponse.ok || !filesResponse.ok) {
      throw new Error('conversation-load-failed');
    }

    const [messagesPayload, filesPayload] = (await Promise.all([
      messagesResponse.json(),
      filesResponse.json()
    ])) as [ConversationPayload, ConversationPayload];

    setConversation({
      messages: messagesPayload.messages ?? [],
      files: filesPayload.files ?? []
    });
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeBookingId || messageDraft.trim().length === 0) {
      return;
    }

    setIsSendingMessage(true);
    setSendError(null);
    setSendStatus(null);

    try {
      const response = await fetch(`/api/bookings/${activeBookingId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          body: messageDraft
        })
      });

      if (!response.ok) {
        throw new Error('message-send-failed');
      }

      setMessageDraft('');
      await reloadConversation(activeBookingId);
      setSendStatus('Mensaje enviado.');
    } catch {
      setSendError('No pudimos enviar el mensaje.');
    } finally {
      setIsSendingMessage(false);
    }
  }

  async function handleUploadFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeBookingId || !selectedUploadFile) {
      return;
    }

    setIsUploadingFile(true);
    setUploadError(null);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedUploadFile);
      formData.append('purpose', uploadPurpose);

      const response = await fetch(`/api/bookings/${activeBookingId}/files`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('file-upload-failed');
      }

      setSelectedUploadFile(null);
      setUploadInputKey((current) => current + 1);
      await reloadConversation(activeBookingId);
      setUploadStatus('Archivo subido.');
    } catch {
      setUploadError('No pudimos subir el archivo.');
    } finally {
      setIsUploadingFile(false);
    }
  }

  if (bookings.length === 0) {
    return (
      <Card className="border-border/70 bg-card/90 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Bookings y chat</CardTitle>
          <CardDescription>Cuando tengas bookings activos, la conversación aparece acá.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Todavía no hay bookings asociados a esta cuenta.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/70 bg-card/90 shadow-soft">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Bookings y chat</CardTitle>
        <CardDescription>Elegí un booking para ver la conversación y los adjuntos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="space-y-3">
            {bookings.map((booking) => {
              const selected = booking.id === activeBookingId;

              return (
                <button
                  key={booking.id}
                  type="button"
                  onClick={() => setSelectedBookingId(booking.id)}
                  className={[
                    'w-full rounded-lg border p-4 text-left transition',
                    selected
                      ? 'border-primary/40 bg-primary/5 shadow-soft'
                      : 'border-border/70 bg-background/60 hover:border-border hover:bg-background'
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">{getBookingTitle(booking)}</p>
                    <Badge variant={selected ? 'default' : 'secondary'}>{booking.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{getBookingSubtitle(booking)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(booking.scheduledFor)}</p>
                </button>
              );
            })}
          </div>

          <div className="space-y-4 rounded-lg border border-border/70 bg-background/70 p-5">
            {selectedBooking ? (
              <>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{selectedBooking.status}</Badge>
                    <Badge variant="outline">{selectedBooking.category.name}</Badge>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{selectedBooking.description}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedBooking.address.label} · {selectedBooking.address.line1}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Contratista: {selectedBooking.contractorProfile.user.displayName ?? selectedBooking.contractorProfile.user.email}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Conversación
                    </h4>
                    {isLoadingConversation ? (
                      <p className="text-xs text-muted-foreground">Cargando...</p>
                    ) : null}
                  </div>

                  {conversationError ? (
                    <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {conversationError}
                    </p>
                  ) : null}

                  <div className="space-y-3">
                    {conversation.messages.length === 0 ? (
                      <p className="rounded-lg border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                        Aún no hay mensajes en este booking.
                      </p>
                    ) : (
                      conversation.messages.map((message) => (
                        <article
                          key={message.id}
                          className={[
                            'rounded-lg border px-4 py-3',
                            message.kind === 'SYSTEM'
                              ? 'border-border/70 bg-muted/30'
                              : 'border-border/70 bg-card'
                          ].join(' ')}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{getMessageAuthor(message)}</p>
                            <Badge variant={message.kind === 'SYSTEM' ? 'secondary' : 'outline'}>
                              {message.kind}
                            </Badge>
                            <p className="text-xs text-muted-foreground">{formatDateTime(message.createdAt)}</p>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-foreground">{message.body}</p>
                        </article>
                      ))
                    )}
                  </div>
                </div>

                <form className="space-y-3" onSubmit={handleSendMessage}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="booking-message">
                      Nuevo mensaje
                    </label>
                    <Textarea
                      id="booking-message"
                      value={messageDraft}
                      onChange={(event) => setMessageDraft(event.target.value)}
                      placeholder="Escribí una actualización para este booking"
                    />
                  </div>

                  {sendError ? (
                    <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {sendError}
                    </p>
                  ) : null}

                  {sendStatus ? (
                    <p className="rounded-lg border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                      {sendStatus}
                    </p>
                  ) : null}

                  <Button type="submit" disabled={isSendingMessage || messageDraft.trim().length === 0}>
                    {isSendingMessage ? 'Enviando...' : 'Enviar mensaje'}
                  </Button>
                </form>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Adjuntos
                  </h4>

                  {conversation.files.length === 0 ? (
                    <p className="rounded-lg border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                      No hay archivos subidos para este booking.
                    </p>
                  ) : (
                    <div className="grid gap-3">
                      {conversation.files.map((file) => (
                        <article key={file.id} className="rounded-lg border border-border/70 bg-card px-4 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-foreground">{file.fileName}</p>
                              <p className="text-xs text-muted-foreground">{file.mimeType}</p>
                            </div>
                            <Badge variant="outline">{file.purpose}</Badge>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {file.uploadedByUser?.displayName ?? file.uploadedByUser?.email ?? 'Usuario'} ·{' '}
                            {formatDateTime(file.createdAt)}
                          </p>
                          {file.storageUrl ? (
                            <a
                              className="mt-2 inline-flex text-sm font-medium text-foreground underline underline-offset-4"
                              href={file.storageUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Abrir archivo
                            </a>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  )}
                </div>

                <form className="space-y-4 rounded-lg border border-border/70 bg-muted/20 p-4" onSubmit={handleUploadFile}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="booking-file">
                      Subir archivo
                    </label>
                    <Input
                      key={uploadInputKey}
                      id="booking-file"
                      type="file"
                      onChange={(event) => {
                        setUploadError(null);
                        setUploadStatus(null);
                        setSelectedUploadFile(event.target.files?.[0] ?? null);
                      }}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground" htmlFor="booking-file-purpose">
                        Propósito
                      </label>
                      <select
                        id="booking-file-purpose"
                        className="flex h-11 w-full rounded-lg border border-input bg-card px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        value={uploadPurpose}
                        onChange={(event) => setUploadPurpose(event.target.value as BookingFilePurpose)}
                      >
                        <option value="CHAT_ATTACHMENT">CHAT_ATTACHMENT</option>
                        <option value="PROBLEM_PHOTO">PROBLEM_PHOTO</option>
                        <option value="PAYMENT_PROOF">PAYMENT_PROOF</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <p className="text-xs leading-5 text-muted-foreground">
                        La subida va a Blob y después se guarda como archivo auditable del booking.
                      </p>
                    </div>
                  </div>

                  {uploadError ? (
                    <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {uploadError}
                    </p>
                  ) : null}

                  {uploadStatus ? (
                    <p className="rounded-lg border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                      {uploadStatus}
                    </p>
                  ) : null}

                  <Button type="submit" disabled={isUploadingFile || !selectedUploadFile}>
                    {isUploadingFile ? 'Subiendo...' : 'Subir archivo'}
                  </Button>
                </form>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Seleccioná un booking para ver la conversación.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
