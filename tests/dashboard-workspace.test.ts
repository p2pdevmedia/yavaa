import { describe, expect, it } from 'vitest';

import { type BookingFileRecord, type BookingMessageRecord } from '@/lib/booking-communication';
import { type BookingRecord } from '@/lib/bookings';
import {
  serializeBookingFileForDashboard,
  serializeBookingMessageForDashboard,
  serializeBookingForDashboard
} from '@/lib/dashboard-workspace';

describe('dashboard workspace serializers', () => {
  it('serializes booking data into a client-safe shape', () => {
    const booking = {
      id: 'booking_001',
      status: 'ACCEPTED',
      scheduledFor: new Date('2026-05-10T10:00:00.000Z'),
      description: 'Fix a leaking faucet',
      contractorNote: 'See you at 10',
      decisionReason: null,
      rescheduleRequestedAt: null,
      acceptedAt: new Date('2026-05-09T12:00:00.000Z'),
      rejectedAt: null,
      cancelledAt: null,
      createdAt: new Date('2026-05-09T10:00:00.000Z'),
      updatedAt: new Date('2026-05-09T10:00:00.000Z'),
      client: {
        id: 'user_client',
        email: 'client@yavaa.test',
        displayName: 'Client One',
        profile: {
          firstName: 'Client',
          lastName: 'One'
        }
      },
      contractorProfile: {
        id: 'contractor_001',
        user: {
          id: 'user_contractor',
          email: 'contractor@yavaa.test',
          displayName: 'Contractor One',
          profile: {
            firstName: 'Contractor',
            lastName: 'One'
          }
        }
      },
      category: {
        id: 'category_001',
        slug: 'home-services',
        name: 'Home Services'
      },
      address: {
        id: 'address_001',
        label: 'Home',
        line1: 'Main 123',
        line2: null,
        city: 'San Martin de los Andes',
        province: 'Neuquen',
        postalCode: '8370',
        market: {
          id: 'market_001',
          slug: 'san-martin-de-los-andes',
          city: 'San Martin de los Andes',
          province: 'Neuquen',
          country: 'Argentina'
        }
      }
    } as BookingRecord;

    const serialized = serializeBookingForDashboard(booking);

    expect(serialized).toMatchObject({
      id: 'booking_001',
      status: 'ACCEPTED',
      scheduledFor: '2026-05-10T10:00:00.000Z',
      contractorProfile: {
        user: {
          displayName: 'Contractor One'
        }
      }
    });
  });

  it('serializes booking messages and files into a client-safe shape', () => {
    const message = {
      id: 'message_001',
      bookingId: 'booking_001',
      senderUserId: 'user_client',
      kind: 'USER',
      systemEvent: null,
      body: 'I am on my way',
      createdAt: new Date('2026-05-09T12:30:00.000Z'),
      updatedAt: new Date('2026-05-09T12:30:00.000Z'),
      senderUser: {
        id: 'user_client',
        email: 'client@yavaa.test',
        displayName: 'Client One',
        profile: {
          firstName: 'Client',
          lastName: 'One',
          avatarUrl: null
        }
      }
    } as BookingMessageRecord;

    const file = {
      id: 'file_001',
      bookingId: 'booking_001',
      messageId: 'message_001',
      uploadedByUserId: 'user_client',
      purpose: 'CHAT_ATTACHMENT',
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      storageKey: 'bookings/booking_001/photo.jpg',
      storageUrl: 'https://cdn.yavaa.test/photo.jpg',
      sizeBytes: 1024,
      createdAt: new Date('2026-05-09T12:31:00.000Z'),
      updatedAt: new Date('2026-05-09T12:31:00.000Z'),
      uploadedByUser: {
        id: 'user_client',
        email: 'client@yavaa.test',
        displayName: 'Client One',
        profile: {
          firstName: 'Client',
          lastName: 'One',
          avatarUrl: null
        }
      }
    } as BookingFileRecord;

    expect(serializeBookingMessageForDashboard(message)).toMatchObject({
      id: 'message_001',
      createdAt: '2026-05-09T12:30:00.000Z',
      senderUser: {
        displayName: 'Client One'
      }
    });

    expect(serializeBookingFileForDashboard(file)).toMatchObject({
      id: 'file_001',
      createdAt: '2026-05-09T12:31:00.000Z',
      uploadedByUser: {
        displayName: 'Client One'
      }
    });
  });
});
