import axios from 'axios';
import { AnalyticsQueryParams } from '../schemas';
import { logger } from '../logger';

export async function getAnalytics(params: AnalyticsQueryParams) {
  try {
    logger.info('Fetching analytics:', params);
    
    const response = await axios.get(`${process.env.LARAVEL_API_URL}/analytics/${params.metric}`, {
      params: {
        start_date: params.dateRange.start,
        end_date: params.dateRange.end,
        venue_id: params.venueId,
        group_by: params.groupBy,
      },
      headers: {
        'Authorization': `Bearer ${process.env.LARAVEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      data: response.data,
      message: `Analytics data retrieved for ${params.metric} from ${params.dateRange.start} to ${params.dateRange.end}.`,
    };
  } catch (error) {
    logger.error('Error fetching analytics:', error);
    return {
      success: false,
      error: 'Failed to retrieve analytics data. Please try again.',
    };
  }
}

export const getAnalyticsFunction = {
  name: 'get_analytics',
  description: 'Retrieve analytics data for bookings, revenue, occupancy, or popular venues',
  parameters: {
    type: 'object',
    properties: {
      metric: {
        type: 'string',
        enum: ['bookings', 'revenue', 'occupancy', 'popular_venues'],
        description: 'Type of analytics data to retrieve',
      },
      dateRange: {
        type: 'object',
        properties: {
          start: {
            type: 'string',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
            description: 'Start date in YYYY-MM-DD format',
          },
          end: {
            type: 'string',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
            description: 'End date in YYYY-MM-DD format',
          },
        },
        required: ['start', 'end'],
        description: 'Date range for analytics query',
      },
      venueId: {
        type: 'string',
        description: 'Optional venue ID to filter analytics for specific venue',
      },
      groupBy: {
        type: 'string',
        enum: ['day', 'week', 'month'],
        description: 'How to group the analytics data',
      },
    },
    required: ['metric', 'dateRange'],
  },
};
