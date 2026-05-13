'use client';

import { useMemo, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export type OfferChatMessage = {
  id: string;
  offerId: string;
  authorId: string;
  body: string;
  createdAt: Date | string;
};

type OfferChatProps = {
  offerId: string;
  initialMessages: OfferChatMessage[];
  currentUserId?: string | null;
  authorLabels?: Record<string, string>;
};

type OfferMessageResponse =
  | {
      ok: true;
      message: OfferChatMessage;
    }
  | {
      ok: false;
      message?: string;
      fieldErrors?: Partial<Record<'body' | 'form', string[]>>;
    };

function formatMessageTime(value: Date | string): string {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }

  return (
    <p id={id} className="text-sm font-semibold text-destructive">
      {messages[0]}
    </p>
  );
}

export function OfferChat({ offerId, initialMessages, currentUserId = null, authorLabels = {} }: OfferChatProps) {
  const bodyErrorId = `offer-chat-${offerId}-body-error`;
  const formErrorId = `offer-chat-${offerId}-form-error`;
  const statusId = `offer-chat-${offerId}-status`;
  const [messages, setMessages] = useState<OfferChatMessage[]>(initialMessages);
  const [body, setBody] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'body' | 'form', string[]>>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const orderedMessages = useMemo(
    () =>
      [...messages].sort(
        (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
      ),
    [messages]
  );

  function getAuthorLabel(authorId: string): string {
    if (authorLabels[authorId]) {
      return authorLabels[authorId];
    }

    return currentUserId && authorId === currentUserId ? 'Vos' : 'La otra parte';
  }

  function updateBody(value: string) {
    setBody(value);
    setFieldErrors({});
    setStatusMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    setStatusMessage(null);

    try {
      const response = await fetch(`/api/job-offers/${offerId}/messages`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          body
        })
      });
      const responseBody = (await response.json()) as OfferMessageResponse;

      if (!response.ok || !responseBody.ok) {
        setFieldErrors(
          !responseBody.ok && responseBody.fieldErrors
            ? responseBody.fieldErrors
            : {
                form: [!responseBody.ok && responseBody.message ? responseBody.message : 'No pudimos enviar el mensaje.']
              }
        );
        return;
      }

      setMessages((current) => [...current, responseBody.message]);
      setBody('');
      setStatusMessage('Mensaje enviado.');
    } catch {
      setFieldErrors({
        form: ['No pudimos conectar con Yavaa. Probá de nuevo.']
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const bodyDescriptionId = fieldErrors.body?.length ? bodyErrorId : undefined;
  const formDescriptionId = fieldErrors.form?.length ? formErrorId : undefined;

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="space-y-1">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Chat de la oferta</p>
      </div>

      <div className="max-h-72 space-y-3 overflow-y-auto rounded-[18px] border border-border bg-card p-3">
        {orderedMessages.length === 0 ? (
          <p className="text-sm leading-6 text-muted-foreground">Todavía no hay mensajes en esta oferta.</p>
        ) : (
          orderedMessages.map((message) => {
            const isCurrentUser = currentUserId ? message.authorId === currentUserId : false;

            return (
              <article
                key={message.id}
                className={`space-y-1 rounded-[16px] px-3 py-2 ${
                  isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                  <span>{getAuthorLabel(message.authorId)}</span>
                  <time dateTime={new Date(message.createdAt).toISOString()}>{formatMessageTime(message.createdAt)}</time>
                </div>
                <p className="whitespace-pre-line text-sm leading-6">{message.body}</p>
              </article>
            );
          })
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        aria-busy={isSubmitting}
        aria-describedby={formDescriptionId ?? statusId}
        className="space-y-2"
      >
        <Label htmlFor={`offer-chat-${offerId}-body`}>Mensaje</Label>
        <textarea
          id={`offer-chat-${offerId}-body`}
          name="body"
          className="min-h-24 w-full rounded-[18px] border border-input bg-background px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="Escribí un mensaje para esta oferta."
          value={body}
          aria-invalid={Boolean(fieldErrors.body?.length)}
          aria-describedby={bodyDescriptionId}
          onChange={(event) => updateBody(event.target.value)}
        />
        <FieldError id={bodyErrorId} messages={fieldErrors.body} />
        <FieldError id={formErrorId} messages={fieldErrors.form} />

        {isSubmitting || statusMessage ? (
          <p id={statusId} role="status" aria-live="polite" className="text-sm font-semibold text-foreground">
            {isSubmitting ? 'Enviando mensaje...' : statusMessage}
          </p>
        ) : null}

        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
        </Button>
      </form>
    </div>
  );
}
