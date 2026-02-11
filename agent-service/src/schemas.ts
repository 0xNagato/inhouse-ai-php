import { z } from 'zod';

// Chat schemas
export const ChatRequestSchema = z.object({
  message: z.string().min(1),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  context: z.record(z.any()).optional(),
});

export const ChatResponseSchema = z.object({
  message: z.string(),
  functionCalls: z.array(z.object({
    name: z.string(),
    arguments: z.record(z.any()),
    result: z.any(),
  })).optional(),
  sessionId: z.string(),
  timestamp: z.string(),
});

// Tool schemas
export const SearchVenuesSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  cuisine: z.string().optional(),
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional(),
  limit: z.number().min(1).max(50).default(10),
});

export const CheckAvailabilitySchema = z.object({
  venueId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  partySize: z.number().min(1).max(20),
});

export const CreateBookingSchema = z.object({
  venueId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  partySize: z.number().min(1).max(20),
  guestName: z.string().min(1),
  guestEmail: z.string().email(),
  guestPhone: z.string().optional(),
  specialRequests: z.string().optional(),
});

export const AnalyticsQuerySchema = z.object({
  metric: z.enum(['bookings', 'revenue', 'occupancy', 'popular_venues']),
  dateRange: z.object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  venueId: z.string().optional(),
  groupBy: z.enum(['day', 'week', 'month']).optional(),
});

export const UserQuerySchema = z.object({
  userId: z.string().optional(),
  email: z.string().email().optional(),
  includeBookings: z.boolean().default(false),
  includePreferences: z.boolean().default(false),
});

// Type exports
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
export type SearchVenuesParams = z.infer<typeof SearchVenuesSchema>;
export type CheckAvailabilityParams = z.infer<typeof CheckAvailabilitySchema>;
export type CreateBookingParams = z.infer<typeof CreateBookingSchema>;
export type AnalyticsQueryParams = z.infer<typeof AnalyticsQuerySchema>;
export type UserQueryParams = z.infer<typeof UserQuerySchema>;
