import { type NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { adminBookingCorrectionSchema, correctBookingForAdmin } from '@/lib/admin-bookings';
import { jsonResponse } from '@/lib/http';
import { getPrismaClient } from '@/lib/prisma';
import { resolveRequestAuth } from '@/lib/request-auth';

type RouteContext = {
  params: Promise<{
    bookingId: string;
  }>;
};

function mapAdminBookingCorrectionError(error: unknown): { status: number; body: { error: string; message: string } } {
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: 'invalid-request',
        message: 'Booking correction payload is invalid.'
      }
    };
  }

  if (error instanceof Error) {
    if (error.message === 'forbidden') {
      return {
        status: 403,
        body: {
          error: 'forbidden',
          message: 'Only active admins can correct bookings.'
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

    if (error.message === 'reason-required') {
      return {
        status: 422,
        body: {
          error: 'reason-required',
          message: 'A correction reason is required.'
        }
      };
    }

    if (error.message === 'invalid-state') {
      return {
        status: 422,
        body: {
          error: 'invalid-state',
          message: 'The booking cannot be corrected in its current state.'
        }
      };
    }
  }

  return {
    status: 500,
    body: {
      error: 'internal-error',
      message: 'We could not correct the booking.'
    }
  };
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
        message: 'Only active admins can correct bookings.'
      },
      { status: 403 }
    );
  }

  const { bookingId } = await params;
  const prisma = getPrismaClient();

  try {
    const parsedBody = adminBookingCorrectionSchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return jsonResponse(
        {
          error: 'invalid-request',
          issues: parsedBody.error.flatten()
        },
        { status: 400 }
      );
    }

    const booking = await correctBookingForAdmin(prisma, auth.permissionContext, bookingId, parsedBody.data);

    return jsonResponse(
      {
        booking
      },
      { status: 200 }
    );
  } catch (error) {
    const mapped = mapAdminBookingCorrectionError(error);

    return jsonResponse(mapped.body, { status: mapped.status });
  }
}
