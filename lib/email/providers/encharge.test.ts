import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test';
import { EmailProviderError } from '../types';

// Set a fake key before the provider and config modules load, so a local
// .env value is never used in assertions or failure output.
process.env.ENCHARGE_WRITE_KEY = 'test-write-key';
const { EnchargeProvider } = await import('./encharge');

const ENDPOINT = 'https://ingest.encharge.io/v1/test-write-key';

const subscriber = {
  email: 'jane@example.com',
  name: 'Jane Q Doe',
  ip: '203.0.113.7',
  metadata: { source: 'job-alerts' },
};

describe('EnchargeProvider', () => {
  afterEach(() => {
    // Restore the real fetch after each test
    mock.restore();
  });

  test('posts the subscriber as JSON and returns success', async () => {
    const fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 200 })
    );

    const result = await new EnchargeProvider().subscribe(subscriber);

    expect(result).toEqual({ success: true });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(ENDPOINT);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
    });

    const body = JSON.parse(init.body as string);
    expect(body).toEqual({
      name: 'Job Alert Subscription',
      user: {
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Q Doe',
        tags: 'job-alerts-subscriber',
        ip: '203.0.113.7',
      },
      properties: {
        source: 'job-alerts',
        signupDate: expect.any(String),
        submittedName: 'Jane Q Doe',
      },
      sourceIp: '203.0.113.7',
    });
  });

  test('throws EmailProviderError with the status code on non-2xx', async () => {
    spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('bad request', { status: 400 })
    );

    const promise = new EnchargeProvider().subscribe(subscriber);

    await expect(promise).rejects.toBeInstanceOf(EmailProviderError);
    await expect(promise).rejects.toThrow(
      'Request failed with status code 400'
    );
  });

  test('wraps network errors in EmailProviderError', async () => {
    spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'));

    const promise = new EnchargeProvider().subscribe(subscriber);

    await expect(promise).rejects.toBeInstanceOf(EmailProviderError);
    await expect(promise).rejects.toMatchObject({
      message: 'fetch failed',
      provider: 'encharge',
    });
  });
});
