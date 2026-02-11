import axios from 'axios';
import { CheckAvailabilityParams } from '../schemas';
import { logger } from '../logger';

export async function checkAvailability(params: CheckAvailabilityParams) {
  try {
    logger.info('Checking availability:', params);
    
    const response = await axios.post(`${process.env.LARAVEL_API_URL}/venues/${params.venueId}/availability`, {
      date: params.date,
      time: params.time,
      party_size: params.partySize,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.LARAVEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      data: response.data,
      message: response.data.available 
        ? `Table is available for ${params.partySize} people on ${params.date} at ${params.time}.`
        : `Unfortunately, no availability for ${params.partySize} people on ${params.date} at ${params.time}.`,
    };
  } catch (error) {
    logger.error('Error checking availability:', error);
    return {
      success: false,
      error: 'Failed to check availability. Please try again.',
    };
  }
}

export const checkAvailabilityFunction = {
  name: 'check_availability',
  description: 'Check table availability for a specific venue, date, time, and party size',
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
    },
    required: ['venueId', 'date', 'time', 'partySize'],
  },
};
