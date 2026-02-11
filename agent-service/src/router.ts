import { searchVenues, searchVenuesFunction } from './tools/search';
import { checkAvailability, checkAvailabilityFunction } from './tools/availability';
import { createBooking, createBookingFunction } from './tools/booking';
import { getAnalytics, getAnalyticsFunction } from './tools/analytics';
import { getUserInfo, getUserInfoFunction } from './tools/users';
import { logger } from './logger';

export interface FunctionCall {
  name: string;
  arguments: Record<string, any>;
}

export interface FunctionResult {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

// Function registry
const FUNCTION_REGISTRY = {
  search_venues: {
    handler: searchVenues,
    schema: searchVenuesFunction,
  },
  check_availability: {
    handler: checkAvailability,
    schema: checkAvailabilityFunction,
  },
  create_booking: {
    handler: createBooking,
    schema: createBookingFunction,
  },
  get_analytics: {
    handler: getAnalytics,
    schema: getAnalyticsFunction,
  },
  get_user_info: {
    handler: getUserInfo,
    schema: getUserInfoFunction,
  },
};

// Get all available functions for OpenAI
export function getAvailableFunctions(): any[] {
  return Object.values(FUNCTION_REGISTRY).map(func => func.schema);
}

// Execute a function call
export async function executeFunctionCall(
  functionCall: FunctionCall,
  userRole: string = 'user'
): Promise<FunctionResult> {
  const { name, arguments: args } = functionCall;

  logger.info(`Executing function: ${name}`, { args, userRole });

  if (!FUNCTION_REGISTRY[name]) {
    logger.error(`Unknown function: ${name}`);
    return {
      success: false,
      error: `Unknown function: ${name}`,
    };
  }

  try {
    const result = await FUNCTION_REGISTRY[name].handler(args);
    logger.info(`Function ${name} executed successfully`);
    return result;
  } catch (error) {
    logger.error(`Error executing function ${name}:`, error);
    return {
      success: false,
      error: `Failed to execute ${name}: ${error.message}`,
    };
  }
}

// Validate function arguments against schema
export function validateFunctionArguments(
  functionName: string,
  args: Record<string, any>
): { valid: boolean; errors?: string[] } {
  if (!FUNCTION_REGISTRY[functionName]) {
    return {
      valid: false,
      errors: [`Unknown function: ${functionName}`],
    };
  }

  // Basic validation - you can enhance this with more sophisticated schema validation
  const schema = FUNCTION_REGISTRY[functionName].schema;
  const required = schema.parameters.required || [];
  const missing = required.filter(field => !(field in args));

  if (missing.length > 0) {
    return {
      valid: false,
      errors: [`Missing required arguments: ${missing.join(', ')}`],
    };
  }

  return { valid: true };
}
