// Sensitive data redaction for logging
const SENSITIVE_FIELDS = [
  'email',
  'guestEmail',
  'phone',
  'guestPhone',
  'password',
  'token',
  'apiKey',
  'creditCard',
  'ssn',
];

export function redactSensitiveData(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveData(item));
  }

  const redacted = { ...obj };
  
  for (const key in redacted) {
    const lowerKey = key.toLowerCase();
    
    // Check if key contains sensitive information
    const isSensitive = SENSITIVE_FIELDS.some(field => 
      lowerKey.includes(field.toLowerCase())
    );
    
    if (isSensitive) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = redactSensitiveData(redacted[key]);
    }
  }
  
  return redacted;
}

export function redactLog(message: string, data?: any) {
  if (data) {
    return {
      message,
      data: redactSensitiveData(data),
    };
  }
  return { message };
}

// Email masking helper
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '[INVALID_EMAIL]';
  
  const [username, domain] = email.split('@');
  const maskedUsername = username.length > 2 
    ? `${username.slice(0, 2)}***`
    : '***';
  
  return `${maskedUsername}@${domain}`;
}

// Phone masking helper
export function maskPhone(phone: string): string {
  if (!phone) return '[NO_PHONE]';
  
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length >= 10) {
    return `***-***-${cleanPhone.slice(-4)}`;
  }
  return '***-***-****';
}
