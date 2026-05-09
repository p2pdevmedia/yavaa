import { type NextRequest } from 'next/server';
import { ZodError, z } from 'zod';

import { bookingFileSchema, listBookingFilesForActor, registerBookingFile } from '@/lib/booking-communication';
import { uploadBookingFileToBlob } from '@/lib/booking-file-storage';
import { jsonResponse } from '@/lib/http';
import { getPrismaClient } from '@/lib/prisma';
import { resolveRequestAuth } from '@/lib/request-auth';

type RouteContext = {
  params: Promise<{
    bookingId: string;
  }>;
};

function mapBookingFileError(error: unknown): { status: number; body: { error: string; message: string } } {
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: 'invalid-request',
        message: 'Booking file payload is invalid.'
      }
    };
  }

  if (error instanceof Error) {
    if (error.message === 'invalid-file' || error.message === 'invalid-message-id') {
      return {
        status: 400,
        body: {
          error: 'invalid-request',
          message: 'Booking file payload is invalid.'
        }
      };
    }

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
      message: 'We could not process the booking file.'
    }
  };
}

function parseMultipartBookingFileInput(formData: FormData): {
  file: File;
  purpose: 'CHAT_ATTACHMENT' | 'PROBLEM_PHOTO' | 'PAYMENT_PROOF';
  messageId: string | null;
} {
  const messageIdSchema = z.string().uuid();
  const rawFile = formData.get('file');
  const rawPurpose = formData.get('purpose');
  const rawMessageId = formData.get('messageId');

  if (!(rawFile instanceof File)) {
    throw new Error('invalid-file');
  }

  const purpose =
    typeof rawPurpose === 'string' && ['CHAT_ATTACHMENT', 'PROBLEM_PHOTO', 'PAYMENT_PROOF'].includes(rawPurpose)
      ? (rawPurpose as 'CHAT_ATTACHMENT' | 'PROBLEM_PHOTO' | 'PAYMENT_PROOF')
      : 'CHAT_ATTACHMENT';

  const messageIdValue = typeof rawMessageId === 'string' && rawMessageId.trim().length > 0 ? rawMessageId.trim() : null;

  if (messageIdValue !== null && !messageIdSchema.safeParse(messageIdValue).success) {
    throw new Error('invalid-message-id');
  }

  return {
    file: rawFile,
    purpose,
    messageId: messageIdValue
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
        message: 'You need an active linked account to view booking files.'
      },
      { status: 403 }
    );
  }

  const { bookingId } = await params;
  const prisma = getPrismaClient();

  try {
    const files = await listBookingFilesForActor(prisma, auth.permissionContext, bookingId);

    return jsonResponse(
      {
        files
      },
      { status: 200 }
    );
  } catch (error) {
    const mapped = mapBookingFileError(error);

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
        message: 'You need an active linked account to register booking files.'
      },
      { status: 403 }
    );
  }

  const { bookingId } = await params;
  const contentType = request.headers.get('content-type') ?? '';

  const prisma = getPrismaClient();

  try {
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const parsedForm = parseMultipartBookingFileInput(formData);
      const uploadedFile = await uploadBookingFileToBlob(bookingId, parsedForm.file);

      const file = await registerBookingFile(prisma, auth.permissionContext, bookingId, {
        purpose: parsedForm.purpose,
        fileName: parsedForm.file.name,
        mimeType: parsedForm.file.type || 'application/octet-stream',
        storageKey: uploadedFile.storageKey,
        storageUrl: uploadedFile.storageUrl,
        sizeBytes: parsedForm.file.size,
        messageId: parsedForm.messageId
      });

      return jsonResponse(
        {
          file
        },
        { status: 201 }
      );
    }

    const parsedBody = bookingFileSchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return jsonResponse(
        {
          error: 'invalid-request',
          issues: parsedBody.error.flatten()
        },
        { status: 400 }
      );
    }

    const file = await registerBookingFile(prisma, auth.permissionContext, bookingId, parsedBody.data);

    return jsonResponse(
      {
        file
      },
      { status: 201 }
    );
  } catch (error) {
    const mapped = mapBookingFileError(error);

    return jsonResponse(mapped.body, { status: mapped.status });
  }
}
