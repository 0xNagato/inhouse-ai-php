import axios from 'axios';
import { UserQueryParams } from '../schemas';
import { logger } from '../logger';

export async function getUserInfo(params: UserQueryParams) {
  try {
    logger.info('Fetching user info:', { ...params, email: params.email ? '[REDACTED]' : undefined });
    
    const queryParams: any = {};
    if (params.userId) queryParams.user_id = params.userId;
    if (params.email) queryParams.email = params.email;
    queryParams.include_bookings = params.includeBookings;
    queryParams.include_preferences = params.includePreferences;

    const response = await axios.get(`${process.env.LARAVEL_API_URL}/users`, {
      params: queryParams,
      headers: {
        'Authorization': `Bearer ${process.env.LARAVEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      data: response.data,
      message: `User information retrieved successfully.`,
    };
  } catch (error) {
    logger.error('Error fetching user info:', error);
    return {
      success: false,
      error: 'Failed to retrieve user information. Please try again.',
    };
  }
}

export const getUserInfoFunction = {
  name: 'get_user_info',
  description: 'Retrieve user information including bookings and preferences',
  parameters: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'Unique user identifier',
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address',
      },
      includeBookings: {
        type: 'boolean',
        default: false,
        description: 'Include user booking history',
      },
      includePreferences: {
        type: 'boolean',
        default: false,
        description: 'Include user dining preferences',
      },
    },
  },
};
