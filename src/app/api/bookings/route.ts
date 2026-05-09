import { type NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { jsonResponse } from '@/lib/http';
import { getPrismaClient } from '@/lib/prisma';
import { createScheduledBooking, createScheduledBookingSchema, listBookingsForActor } from '@/lib/bookings';
import { resolveRequestAuth } from '@/lib/request-auth';

function mapBookingError(error: unknown): { status: number; body: { error: string; message: string } } {
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: 'invalid-request',
        message: 'Booking payload is invalid.'
      }
    };
  }

  if (error instanceof Error) {
    if (error.message === 'forbidden') {
      return {
        status: 403,
        body: {
          error: 'forbidden',
          message: 'You cannot create or view bookings with this account state.'
        }
      };
    }

    if (
      error.message === 'invalid-address' ||
      error.message === 'invalid-category' ||
      error.message === 'invalid-contractor' ||
      error.message === 'invalid-address-market' ||
      error.message === 'invalid-contractor-market'
    ) {
      return {
        status: 422,
        body: {
          error: error.message,
          message: 'The selected booking context is not valid.'
        }
      };
    }
  }

  return {
    status: 500,
    body: {
      error: 'internal-error',
      message: 'We could not process the booking request.'
    }
  };
}

export async function GET(request: NextRequest) {
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

  const prisma = getPrismaClient();
  const bookings = await listBookingsForActor(prisma, auth.permissionContext);

  return jsonResponse(
    {
      bookings
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  const auth = await resolveRequestAuth(request);

  if (!auth.authenticated) {
    return jsonResponse(auth, { status: 401 });
  }

  if (!auth.permissionContext) {
    return jsonResponse(
      {
        error: 'forbidden',
        message: 'You need an active linked account to create bookings.'
      },
      { status: 403 }
    );
  }

  const prisma = getPrismaClient();

  try {
    const parsedBody = createScheduledBookingSchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return jsonResponse(
        {
          error: 'invalid-request',
          issues: parsedBody.error.flatten()
        },
        { status: 400 }
      );
    }

    const booking = await createScheduledBooking(prisma, auth.permissionContext, parsedBody.data);

    return jsonResponse(
      {
        booking
      },
      { status: 201 }
    );
  } catch (error) {
    const mapped = mapBookingError(error);

    return jsonResponse(mapped.body, { status: mapped.status });
  }
}
