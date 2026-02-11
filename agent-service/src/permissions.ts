// Role-based function permissions
export const FUNCTION_PERMISSIONS = {
  // Admin can access all functions
  admin: [
    'search_venues',
    'check_availability',
    'create_booking',
    'get_analytics',
    'get_user_info',
  ],
  
  // Manager can access most functions except sensitive user data
  manager: [
    'search_venues',
    'check_availability',
    'create_booking',
    'get_analytics',
  ],
  
  // Staff can search, check availability, and create bookings
  staff: [
    'search_venues',
    'check_availability',
    'create_booking',
  ],
  
  // Regular users can search and check availability only
  user: [
    'search_venues',
    'check_availability',
  ],
  
  // Guest users have very limited access
  guest: [
    'search_venues',
  ],
};

export function hasPermission(userRole: string, functionName: string): boolean {
  const allowedFunctions = FUNCTION_PERMISSIONS[userRole] || [];
  return allowedFunctions.includes(functionName);
}

export function getPermittedFunctions(userRole: string): string[] {
  return FUNCTION_PERMISSIONS[userRole] || [];
}

export function filterFunctionsByRole(functions: any[], userRole: string): any[] {
  const permittedFunctions = getPermittedFunctions(userRole);
  return functions.filter(func => permittedFunctions.includes(func.name));
}
