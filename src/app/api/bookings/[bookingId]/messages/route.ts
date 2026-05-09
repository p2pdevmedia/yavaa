import { type NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { bookingMessageSchema, listBookingMessagesForActor, sendBookingMessage } from '@/lib/booking-communication';
import { jsonResponse } from '@/lib/http';
import { getPrismaClient } from '@/lib/prisma';
import { resolveRequestAuth } from '@/lib/request-auth';

type RouteContext = {
  params: Promise<{
    bookingId: string;
  }>;
};

function mapBookingMessageError(error: unknown): { status: number; body: { error: string; message: string } } {
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: 'invalid-request',
        message: 'Booking message payload is invalid.'
      }
    };
  }

  if (error instanceof Error) {
    if (error.message === 'forbidden') {
      return {
        status: 403,
        body: {
          error: 'forbidden',
          message: 'You cannot access this booking conversation.'
        }
      };
    }

    if (error.message === 'not-found') {
      return {
        status: 404,
        body: {
          error: 'not-found',
          message: 'Booking not found.'
        }
      };
    }
  }

  return {
    status: 500,
    body: {
      error: 'internal-error',
      message: 'We could not process the booking conversation message.'
    }
  };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = await resolveRequestAuth(request);

  if (!auth.authenticated) {
    return jsonResponse(auth, { status: 401 });
  }

  if (!auth.permissionContext) {
    return jsonResponse(
      {
        error: 'forbidden',
        message: 'You need an active linked account to view booking conversations.'
      },
      { status: 403 }
    );
  }

  const { bookingId } = await params;
  const prisma = getPrismaClient();

  try {
    const messages = await listBookingMessagesForActor(prisma, auth.permissionContext, bookingId);

    return jsonResponse(
      {
        messages
      },
      { status: 200 }
    );
  } catch (error) {
    const mapped = mapBookingMessageError(error);

    return jsonResponse(mapped.body, { status: mapped.status });
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const auth = await resolveRequestAuth(request);

  if (!auth.authenticated) {
    return jsonResponse(auth, { status: 401 });
  }

  if (!auth.permissionContext) {
    return jsonResponse(
      {
        error: 'forbidden',
        message: 'You need an active linked account to send booking messages.'
      },
      { status: 403 }
    );
  }

  const { bookingId } = await params;
  const parsedBody = bookingMessageSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return jsonResponse(
      {
        error: 'invalid-request',
        issues: parsedBody.error.flatten()
      },
      { status: 400 }
    );
  }

  const prisma = getPrismaClient();

  try {
    const message = await sendBookingMessage(prisma, auth.permissionContext, bookingId, parsedBody.data);

    return jsonResponse(
      {
        message
      },
      { status: 201 }
    );
  } catch (error) {
    const mapped = mapBookingMessageError(error);

    return jsonResponse(mapped.body, { status: mapped.status });
  }
}
