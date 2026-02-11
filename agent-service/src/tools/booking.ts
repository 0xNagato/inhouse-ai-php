import axios from 'axios';
import { CreateBookingParams } from '../schemas';
import { logger } from '../logger';

export async function createBooking(params: CreateBookingParams) {
  try {
    logger.info('Creating booking:', { ...params, guestEmail: '[REDACTED]' });
    
    const response = await axios.post(`${process.env.LARAVEL_API_URL}/bookings`, {
      venue_id: params.venueId,
      date: params.date,
      time: params.time,
      party_size: params.partySize,
      guest_name: params.guestName,
      guest_email: params.guestEmail,
      guest_phone: params.guestPhone,
      special_requests: params.specialRequests,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.LARAVEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      data: response.data,
      message: `Booking confirmed! Reservation ID: ${response.data.id}. Confirmation details have been sent to ${params.guestEmail}.`,
    };
  } catch (error) {
    logger.error('Error creating booking:', error);
    return {
      success: false,
      error: 'Failed to create booking. Please try again or contact the restaurant directly.',
    };
  }
}

export const createBookingFunction = {
  name: 'create_booking',
  description: 'Create a new restaurant reservation/booking',
  parameters: {
    type: 'object',
    properties: {
      venueId: {
        type: 'string',
        description: 'Unique identifier for the venue',
      },
      date: {
        type: 'string',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        description: 'Date in YYYY-MM-DD format',
      },
      time: {
        type: 'string',
        pattern: '^\\d{2}:\\d{2}$',
        description: 'Time in HH:MM format (24-hour)',
      },
      partySize: {
        type: 'number',
        minimum: 1,
        maximum: 20,
        description: 'Number of people in the party',
      },
      guestName: {
        type: 'string',
        description: 'Full name of the primary guest',
      },
      guestEmail: {
        type: 'string',
        format: 'email',
        description: 'Email address for confirmation',
      },
      guestPhone: {
        type: 'string',
        description: 'Phone number (optional)',
      },
      specialRequests: {
        type: 'string',
        description: 'Any special requests or dietary restrictions',
      },
    },
    required: ['venueId', 'date', 'time', 'partySize', 'guestName', 'guestEmail'],
  },
};
