import { type NextRequest } from 'next/server';
import { ZodError, z } from 'zod';

import { actOnBooking, bookingActionSchema, getBookingForActor } from '@/lib/bookings';
import { jsonResponse } from '@/lib/http';
import { getPrismaClient } from '@/lib/prisma';
import { resolveRequestAuth } from '@/lib/request-auth';

const bookingActionPayloadSchema = z.object({
  action: bookingActionSchema.shape.action,
  note: bookingActionSchema.shape.note
});

type RouteContext = {
  params: Promise<{
    bookingId: string;
  }>;
};

function mapBookingActionError(error: unknown): { status: number; body: { error: string; message: string } } {
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: 'invalid-request',
        message: 'Booking action payload is invalid.'
      }
    };
  }

  if (error instanceof Error) {
    if (error.message === 'forbidden') {
      return {
        status: 403,
        body: {
          error: 'forbidden',
          message: 'You cannot modify this booking.'
        }
      };
    }

    if (error.message === 'booking-not-found') {
      return {
        status: 404,
        body: {
          error: 'not-found',
          message: 'Booking not found.'
        }
      };
    }

    if (error.message === 'invalid-state') {
      return {
        status: 422,
        body: {
          error: 'invalid-state',
          message: 'The booking cannot transition with that action.'
        }
      };
    }
  }

  return {
    status: 500,
    body: {
      error: 'internal-error',
      message: 'We could not process the booking action.'
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
        message: 'You need an active linked account to view bookings.'
      },
      { status: 403 }
    );
  }

  const { bookingId } = await params;
  const prisma = getPrismaClient();
  const booking = await getBookingForActor(prisma, auth.permissionContext, bookingId);

  if (!booking) {
    return jsonResponse(
      {
        error: 'not-found',
        message: 'Booking not found.'
      },
      { status: 404 }
    );
  }

  return jsonResponse(
    {
      booking
    },
    { status: 200 }
  );
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await resolveRequestAuth(request);

  if (!auth.authenticated) {
    return jsonResponse(auth, { status: 401 });
  }

  if (!auth.permissionContext) {
    return jsonResponse(
      {
        error: 'forbidden',
        message: 'You need an active linked account to change bookings.'
      },
      { status: 403 }
    );
  }

  const { bookingId } = await params;
  const parsedBody = bookingActionPayloadSchema.safeParse(await request.json());

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
    const booking = await actOnBooking(
      prisma,
      auth.permissionContext,
      bookingId,
      parsedBody.data.action,
      parsedBody.data.note ?? null
    );

    return jsonResponse(
      {
        booking
      },
      { status: 200 }
    );
  } catch (error) {
    const mapped = mapBookingActionError(error);

    return jsonResponse(mapped.body, { status: mapped.status });
  }
}
