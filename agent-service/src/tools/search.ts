import axios from 'axios';
import { SearchVenuesParams } from '../schemas';
import { logger } from '../logger';

export async function searchVenues(params: SearchVenuesParams) {
  try {
    logger.info('Searching venues:', params);
    
    const response = await axios.get(`${process.env.LARAVEL_API_URL}/venues/search`, {
      params,
      headers: {
        'Authorization': `Bearer ${process.env.LARAVEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      data: response.data,
      message: `Found ${response.data.length} venues matching your criteria.`,
    };
  } catch (error) {
    logger.error('Error searching venues:', error);
    return {
      success: false,
      error: 'Failed to search venues. Please try again.',
    };
  }
}

export const searchVenuesFunction = {
  name: 'search_venues',
  description: 'Search for venues/restaurants based on various criteria like location, cuisine, price range',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'General search query (restaurant name, cuisine type, etc.)',
      },
      location: {
        type: 'string',
        description: 'Location to search in (city, neighborhood, address)',
      },
      cuisine: {
        type: 'string',
        description: 'Type of cuisine (Italian, Mexican, Asian, etc.)',
      },
      priceRange: {
        type: 'string',
        enum: ['$', '$$', '$$$', '$$$$'],
        description: 'Price range from $ (budget) to $$$$ (fine dining)',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (1-50)',
        minimum: 1,
        maximum: 50,
        default: 10,
      },
    },
  },
};
