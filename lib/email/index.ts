import { EnchargeProvider } from './providers/encharge';

// Export a pre-configured instance of the Encharge provider
export const emailProvider = new EnchargeProvider();

// Export types for convenience
export * from './types';
