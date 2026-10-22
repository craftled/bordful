---
title: Custom Integration Development
description: Learn how to create and implement custom integrations to extend Bordful's functionality.
lastUpdated: "2025-05-22"
---

# Custom Integration Development

While Bordful comes with several built-in integrations, you may need to create custom integrations to connect with specific services or extend functionality. This guide walks you through the process of developing custom integrations for Bordful.

## Integration Development Overview

Creating a custom integration typically involves:

1. **Defining the integration interface**: Determine how your integration will interact with Bordful
2. **Implementing the provider code**: Write the code that connects to the external service
3. **Adding configuration options**: Make your integration configurable via the config system
4. **Creating API routes or webhooks**: If needed, add server-side routes for receiving data
5. **Extending the UI**: Add any necessary UI components to support the integration

## Types of Integrations

Bordful supports several types of integrations:

### 1. Email Provider Integrations

Connect Bordful to additional email marketing platforms or newsletter services.

### 2. Analytics Integrations

Add support for tracking and analytics platforms to monitor user behavior.

### 3. Payment Provider Integrations

Integrate with payment processors for job listing fees or premium features.

### 4. Notification Integrations

Connect with notification services (Slack, Discord, etc.) to alert about new jobs or subscriptions.

### 5. Third-Party API Integrations

Connect with external job boards, applicant tracking systems, or other API-based services.

## Creating an Email Provider Integration

Let's walk through the process of creating a custom email provider integration as an example.

### Step 1: Define the Provider Interface

All email providers must implement the `EmailProvider` interface defined in `lib/email/types.ts`:

```typescript
interface SubscriberData {
  email: string;
  name?: string;
  ip?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

interface EmailProvider {
  name: string;
  subscribe(data: SubscriberData): Promise<{
    success: boolean;
    error?: string;
  }>;
}
```

### Step 2: Create the Provider Implementation

Create a new file in `lib/email/providers/` (e.g., `custom-provider.ts`) that implements the interface:

```typescript
// lib/email/providers/custom-provider.ts
import { EmailProvider, SubscriberData, EmailProviderError } from "../types";
import config from "@/config";

export class CustomProvider implements EmailProvider {
  name = "custom-provider";
  private apiKey: string;
  private endpoint: string;
  private defaultTags: string;

  constructor() {
    // Get configuration from config file or environment variables
    const customConfig = config.email?.customProvider || {};

    this.apiKey = customConfig.apiKey || process.env.CUSTOM_PROVIDER_API_KEY || "";
    this.endpoint = customConfig.endpoint || process.env.CUSTOM_PROVIDER_ENDPOINT || "";
    this.defaultTags = customConfig.defaultTags || "job-alerts-subscriber";

    if (!this.apiKey && process.env.NODE_ENV === "production") {
      throw new Error("Custom provider API key is required in production");
    }
    
    if (!this.endpoint && process.env.NODE_ENV === "production") {
      throw new Error("Custom provider endpoint is required in production");
    }
  }

  async subscribe(data: SubscriberData) {
    try {
      // In development without credentials, simulate success
      if ((!this.apiKey || !this.endpoint) && process.env.NODE_ENV === "development") {
        return { success: true };
      }

      // Format the payload for your custom provider
      const payload = {
        email: data.email,
        name: data.name || "",
        tags: this.defaultTags.split(",").map(tag => tag.trim()),
        ip_address: data.ip,
        metadata: {
          ...data.metadata,
          signup_date: new Date().toISOString(),
        },
      };

      // Make the API call to your custom provider
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      // Check for successful response
      if (!response.ok) {
        throw new Error(`Request failed with status code ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Subscription failed";
      throw new EmailProviderError(errorMessage, "custom-provider");
    }
  }
}
```

### Step 3: Register the Provider

Update `lib/email/index.ts` to include your new provider:

```typescript
// lib/email/index.ts
import { EnchargeProvider } from "./providers/encharge";
import { CustomProvider } from "./providers/custom-provider";
import { EmailProvider } from "./types";
import config from "@/config";

// Function to get the configured email provider
export function getEmailProvider(): EmailProvider {
  const providerName = config.email?.provider || process.env.EMAIL_PROVIDER || "encharge";
  
  switch (providerName.toLowerCase()) {
    case "encharge":
      return new EnchargeProvider();
    case "custom-provider":
      return new CustomProvider();
    default:
      // Default to Encharge if no valid provider is specified
      return new EnchargeProvider();
  }
}
```

### Step 4: Add Configuration Options

Update your TypeScript types in `config/types.ts` to include your new provider:

```typescript
// config/types.ts
// Add to the existing EmailConfig type
export interface EmailConfig {
  provider: string;
  encharge?: {
    writeKey?: string;
    defaultTags?: string;
    eventName?: string;
  };
  customProvider?: {
    apiKey?: string;
    endpoint?: string;
    defaultTags?: string;
  };
  // Other providers...
}
```

### Step 5: Document Configuration Options

Add documentation for your integration to the example config file:

```typescript
// config/config.example.ts
email: {
  // Default provider
  provider: process.env.EMAIL_PROVIDER || "encharge",
  
  // Custom provider configuration
  customProvider: {
    // Your custom provider API key
    apiKey: process.env.CUSTOM_PROVIDER_API_KEY,
    
    // Your custom provider endpoint
    endpoint: process.env.CUSTOM_PROVIDER_ENDPOINT,
    
    // Tags to apply to all subscribers (comma-separated)
    defaultTags: "job-alerts-subscriber, custom-tag",
  },
  
  // Other providers...
},
```

## Creating an Analytics Integration

Analytics integrations typically work with the script loading system.

### Step 1: Create an Initialization Script

Create a new file in the `public/analytics/` directory (e.g., `custom-analytics.js`):

```javascript
// public/analytics/custom-analytics.js
(function() {
  // Get the tracking ID from the script tag
  const trackingId = document.currentScript.getAttribute('data-tracking-id');
  
  // Initialize your analytics platform
  window.customAnalytics = window.customAnalytics || {};
  window.customAnalytics.trackingId = trackingId;
  window.customAnalytics.track = function(eventName, properties) {
    // Implement tracking logic here
    console.log(`Tracking event: ${eventName}`, properties);
    // Make API call to your analytics platform
  };
  
  // Track page view
  window.customAnalytics.track('page_view', {
    page: window.location.pathname,
    referrer: document.referrer
  });
})();
```

### Step 2: Add Script Configuration

Add the script to your config file:

```typescript
// config/config.ts
scripts: {
  head: [
    // Custom analytics initialization
    {
      src: "/analytics/custom-analytics.js",
      strategy: "afterInteractive",
      attributes: {
        "data-tracking-id": process.env.CUSTOM_ANALYTICS_ID,
      }
    }
  ]
}
```

### Step 3: Add Event Tracking Utility

Create or update the analytics utility to support your custom platform:

```typescript
// lib/utils/analytics.ts
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  // Track with existing platforms
  if (window.gtag) {
    window.gtag('event', eventName, properties);
  }
  
  // Track with your custom analytics
  if (window.customAnalytics?.track) {
    window.customAnalytics.track(eventName, properties);
  }
}
```

## Creating a Payment Provider Integration

Payment integrations typically involve both client and server components.

### Step 1: Create the Provider Interface

Define the interface in a new file:

```typescript
// lib/payments/types.ts
export interface PaymentData {
  amount: number;
  currency: string;
  description: string;
  metadata: Record<string, string>;
}

export interface PaymentProvider {
  name: string;
  createCheckoutSession(data: PaymentData): Promise<{
    url: string;
    sessionId: string;
  }>;
  verifyPayment(sessionId: string): Promise<{
    success: boolean;
    paymentId?: string;
    error?: string;
  }>;
}
```

### Step 2: Implement the Provider

Create a new file in `lib/payments/providers/`:

```typescript
// lib/payments/providers/custom-payment.ts
import { PaymentProvider, PaymentData } from "../types";
import config from "@/config";

export class CustomPaymentProvider implements PaymentProvider {
  name = "custom-payment";
  private apiKey: string;
  private successUrl: string;
  private cancelUrl: string;

  constructor() {
    const paymentConfig = config.payments?.customPayment || {};
    
    this.apiKey = paymentConfig.apiKey || process.env.CUSTOM_PAYMENT_API_KEY || "";
    this.successUrl = paymentConfig.successUrl || "/payment/success";
    this.cancelUrl = paymentConfig.cancelUrl || "/payment/cancel";
    
    // Validate configuration
    if (!this.apiKey && process.env.NODE_ENV === "production") {
      throw new Error("Custom payment API key is required in production");
    }
  }

  async createCheckoutSession(data: PaymentData) {
    // Implement checkout session creation
    // This would typically make an API call to your payment provider
    
    // Example (replace with actual implementation):
    const response = await fetch("https://api.custom-payment.com/checkout-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        metadata: data.metadata,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}${this.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}${this.cancelUrl}`
      })
    });
    
    const result = await response.json();
    
    return {
      url: result.checkout_url,
      sessionId: result.session_id
    };
  }

  async verifyPayment(sessionId: string) {
    // Implement payment verification
    // This would typically make an API call to your payment provider
    
    // Example (replace with actual implementation):
    const response = await fetch(`https://api.custom-payment.com/checkout-sessions/${sessionId}`, {
      headers: {
        "Authorization": `Bearer ${this.apiKey}`
      }
    });
    
    const result = await response.json();
    
    return {
      success: result.status === "paid",
      paymentId: result.payment_id,
      error: result.status !== "paid" ? "Payment not completed" : undefined
    };
  }
}
```

### Step 3: Add API Routes

Create server-side API routes to handle payment operations:

```typescript
// app/api/create-checkout-session/route.ts
import { NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, currency, description, metadata } = body;
    
    // Input validation
    if (!amount || !currency || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Get configured payment provider
    const paymentProvider = getPaymentProvider();
    
    // Create checkout session
    const session = await paymentProvider.createCheckoutSession({
      amount,
      currency,
      description,
      metadata: metadata || {}
    });
    
    return NextResponse.json(session);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create checkout session";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
```

## Creating a Notification Integration

Notification integrations send alerts to external services.

### Step 1: Define the Notification Interface

```typescript
// lib/notifications/types.ts
export interface NotificationData {
  title: string;
  message: string;
  url?: string;
  imageUrl?: string;
  type: "info" | "success" | "warning" | "error";
  metadata?: Record<string, any>;
}

export interface NotificationProvider {
  name: string;
  send(data: NotificationData): Promise<{
    success: boolean;
    error?: string;
  }>;
}
```

### Step 2: Implement the Provider

```typescript
// lib/notifications/providers/custom-notification.ts
import { NotificationProvider, NotificationData } from "../types";
import config from "@/config";

export class CustomNotificationProvider implements NotificationProvider {
  name = "custom-notification";
  private webhookUrl: string;
  private username: string;
  private enabled: boolean;

  constructor() {
    const notificationConfig = config.notifications?.customNotification || {};
    
    this.webhookUrl = notificationConfig.webhookUrl || process.env.CUSTOM_NOTIFICATION_WEBHOOK_URL || "";
    this.username = notificationConfig.username || "Bordful Bot";
    this.enabled = notificationConfig.enabled !== false;
    
    if (!this.webhookUrl && process.env.NODE_ENV === "production") {
      console.warn("Custom notification webhook URL is not configured");
    }
  }

  async send(data: NotificationData) {
    // Skip if disabled or no webhook URL
    if (!this.enabled || !this.webhookUrl) {
      return { success: false, error: "Notifications disabled or not configured" };
    }
    
    try {
      // Format the payload for your notification service
      const payload = {
        username: this.username,
        title: data.title,
        message: data.message,
        url: data.url,
        image_url: data.imageUrl,
        type: data.type,
        metadata: data.metadata,
        timestamp: new Date().toISOString()
      };
      
      // Send the notification
      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      return { success: response.ok };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Notification failed";
      return { success: false, error: errorMessage };
    }
  }
}
```

### Step 3: Add Event Handlers

Add logic to trigger notifications for relevant events:

```typescript
// lib/notifications/index.ts
import { CustomNotificationProvider } from "./providers/custom-notification";
import { NotificationProvider } from "./types";
import config from "@/config";

export function getNotificationProvider(): NotificationProvider {
  const providerName = config.notifications?.provider || process.env.NOTIFICATION_PROVIDER || "custom-notification";
  
  switch (providerName.toLowerCase()) {
    case "custom-notification":
      return new CustomNotificationProvider();
    default:
      return new CustomNotificationProvider();
  }
}

// Example event handler for new job submissions
export async function notifyNewJob(jobData: any) {
  const provider = getNotificationProvider();
  
  return provider.send({
    title: "New Job Submission",
    message: `${jobData.title} at ${jobData.company}`,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/jobs/${jobData.slug}`,
    imageUrl: jobData.companyLogo,
    type: "info",
    metadata: {
      jobId: jobData.id,
      company: jobData.company,
      postedAt: new Date().toISOString()
    }
  });
}
```

## Testing Custom Integrations

### Unit Testing

Create unit tests next to your provider and run them with `bun test`:

```typescript
// lib/email/providers/custom-provider.test.ts
import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { CustomProvider } from "@/lib/email/providers/custom-provider";

describe("CustomProvider", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "production";
    process.env.CUSTOM_PROVIDER_API_KEY = "test-api-key";
    process.env.CUSTOM_PROVIDER_ENDPOINT = "https://api.example.com/subscribe";
  });

  afterEach(() => mock.restore());
  
  it("should initialize with environment variables", () => {
    const provider = new CustomProvider();
    expect(provider.name).toBe("custom-provider");
  });
  
  it("should successfully subscribe a user", async () => {
    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    
    const provider = new CustomProvider();
    const result = await provider.subscribe({
      email: "test@example.com",
      name: "Test User"
    });
    
    expect(result.success).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith("https://api.example.com/subscribe", expect.objectContaining({ method: "POST" }));
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]; const body = JSON.parse(init.body as string);
    expect(body).toEqual(expect.objectContaining({
      email: "test@example.com",
      name: "Test User"
    }));
  });
  
  it("should handle API errors", async () => {
    spyOn(globalThis, "fetch").mockRejectedValue(new Error("API Error"));
    
    const provider = new CustomProvider();
    
    await expect(provider.subscribe({
      email: "test@example.com"
    })).rejects.toThrow("API Error");
  });
});
```

### Integration Testing

Create end-to-end tests to verify the integration:

```typescript
// e2e/integration.spec.ts
import { test, expect } from "@playwright/test";

test("Job alert subscription with custom provider", async ({ page }) => {
  // Navigate to job alerts page
  await page.goto("/job-alerts");
  
  // Fill out the subscription form
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="name"]', "Test User");
  
  // Submit the form
  await page.click('button[type="submit"]');
  
  // Verify success message
  await expect(page.locator("text=Subscription Confirmed")).toBeVisible();
});
```

## Best Practices for Custom Integrations

### Security

1. **Never hardcode API keys** - Always use environment variables or secure configuration
2. **Validate and sanitize all inputs** - Protect against injection and other attacks
3. **Implement rate limiting** - Prevent abuse of your integration endpoints
4. **Use HTTPS for all API calls** - Ensure secure communication

### Performance

1. **Implement error handling and retries** - Make integrations resilient
2. **Add appropriate timeouts** - Prevent hanging requests
3. **Consider asynchronous processing** - Use background tasks for non-critical operations
4. **Implement caching where appropriate** - Reduce API calls for frequently accessed data

### Maintainability

1. **Follow TypeScript best practices** - Use proper typing for all interfaces
2. **Document your code thoroughly** - Include JSDoc comments
3. **Create comprehensive tests** - Unit test all integration points
4. **Log appropriately** - Include meaningful logs for debugging

### Compatibility

1. **Consider versioning your integration** - Be prepared for API changes
2. **Follow the provider's best practices** - Review their documentation
3. **Test in multiple environments** - Ensure compatibility with different setups

## Related Documentation

- [Email Provider Integration](/docs/guides/email-integration.md) - Email integration guide
- [Analytics Platform Integrations](/docs/integrations/analytics-platforms.md) - Analytics integration guide
- [Third-Party Service Integrations](/docs/integrations/third-party-services.md) - Guide to other third-party services 