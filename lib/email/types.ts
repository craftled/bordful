/**
 * Basic subscriber data structure
 */
export type SubscriberData = {
  email: string;
  name?: string;
  ip?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>; // More specific type for metadata
};

/**
 * Common interface for all email providers
 */
export type EmailProvider = {
  name: string;
  subscribe(data: SubscriberData): Promise<{
    success: boolean;
    error?: string;
  }>;
};

/**
 * Custom error class for email provider errors
 */
export class EmailProviderError extends Error {
  constructor(
    message: string,
    public provider: string
  ) {
    super(message);
    this.name = 'EmailProviderError';
  }
}
