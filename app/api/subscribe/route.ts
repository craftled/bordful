import { NextResponse } from 'next/server';
import config from '@/config';
import { emailProvider } from '@/lib/email';

// Prevent caching
export const dynamic = 'force-dynamic';

// Simple in-memory rate limiter
// In a production environment, you would use Redis or another distributed cache
type RateLimitInfo = {
  count: number;
  resetTime: number;
};

// Store IP addresses and their request counts
// This will be reset when the server restarts
const rateLimitMap = new Map<string, RateLimitInfo>();

// Rate limit configuration
const RATE_LIMIT_MAX = 5; // Maximum requests per window
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour window

// Rate limiting function
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const rateLimitInfo = rateLimitMap.get(ip);

  if (!rateLimitInfo) {
    // First request from this IP
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  if (now > rateLimitInfo.resetTime) {
    // Reset window has passed
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  // Increment count
  rateLimitInfo.count += 1;
  rateLimitMap.set(ip, rateLimitInfo);

  // Check if over limit
  return rateLimitInfo.count > RATE_LIMIT_MAX;
}

export async function POST(request: Request) {
  try {
    // Check if job alerts feature is enabled
    if (!config.jobAlerts?.enabled) {
      return NextResponse.json(
        { error: 'Job alerts feature is disabled' },
        { status: 404 }
      );
    }

    // Get client IP with fallback for development
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      (process.env.NODE_ENV === 'development' ? '203.0.113.1' : 'unknown');

    // Check rate limit
    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Get and validate form data
    const { name, email } = await request.json();

    // Validate email format with a more comprehensive check
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!(email && emailRegex.test(email))) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Validate name is provided and not empty
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Subscribe the user
    await emailProvider.subscribe({
      email,
      name,
      ip: clientIp,
      metadata: {
        source: 'website-form',
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
        origin: request.headers.get('origin'),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
