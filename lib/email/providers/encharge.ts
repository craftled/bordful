import axios from 'axios';
import config from '@/config';
import {
  type EmailProvider,
  EmailProviderError,
  type SubscriberData,
} from '../types';

export class EnchargeProvider implements EmailProvider {
  name = 'encharge';
  private readonly writeKey: string;
  private readonly defaultTags: string;
  private readonly eventName: string;

  constructor() {
    // Get configuration from config file or environment variables
    const enchargeConfig = config.email?.encharge || {};

    this.writeKey =
      enchargeConfig.writeKey || process.env.ENCHARGE_WRITE_KEY || '';
    this.defaultTags = enchargeConfig.defaultTags || 'job-alerts-subscriber';
    this.eventName = enchargeConfig.eventName || 'Job Alert Subscription';

    if (!this.writeKey && process.env.NODE_ENV === 'production') {
      throw new Error('Encharge write key is required in production');
    }
  }

  async subscribe(data: SubscriberData) {
    try {
      // In development without a key, simulate success
      if (!this.writeKey && process.env.NODE_ENV === 'development') {
        return { success: true };
      }

      // Format the payload for Encharge
      const payload = {
        name: this.eventName,
        user: {
          email: data.email,
          firstName: data.name?.split(' ')[0] || '',
          lastName: data.name?.split(' ').slice(1).join(' ') || '',
          tags: this.defaultTags,
          ip: data.ip,
        },
        properties: {
          ...data.metadata,
          signupDate: new Date().toISOString(),
          submittedName: data.name || 'Not provided',
        },
        sourceIp: data.ip,
      };

      // Make the API call to Encharge
      await axios.post(
        `https://ingest.encharge.io/v1/${this.writeKey}`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Subscription failed';
      throw new EmailProviderError(errorMessage, 'encharge');
    }
  }
}
