'use client';

import { ArrowRight, CheckCircle, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import config from '@/config';
import { useToast } from '@/hooks/use-toast';
import { resolveColor } from '@/lib/utils/colors';

export function JobAlertsForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: { name?: string; email?: string } = {};
    let isValid = true;

    // Validate name
    if (!name || name.trim() === '') {
      newErrors.name =
        config.jobAlerts.form?.fields?.name?.required || 'Name is required';
      isValid = false;
    }

    // Validate email with regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) {
      newErrors.email =
        config.jobAlerts.form?.fields?.email?.required || 'Email is required';
      isValid = false;
    } else if (!emailRegex.test(email)) {
      newErrors.email =
        config.jobAlerts.form?.fields?.email?.invalid ||
        'Please enter a valid email address';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuccess) {
      return;
    }

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Call our API route
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Show success message
        toast({
          title:
            config.jobAlerts.form?.toast?.success?.title ||
            'Subscription successful!',
          description:
            config.jobAlerts.form?.toast?.success?.description ||
            "You'll now receive job alerts in your inbox.",
          variant: 'default',
          className: 'bg-white border border-green-200 shadow-md',
        });

        // Set success state
        setIsSuccess(true);
      } else if (response.status === 429) {
        // Rate limit error
        toast({
          title:
            config.jobAlerts.form?.toast?.rateLimit?.title ||
            'Rate limit exceeded',
          description:
            config.jobAlerts.form?.toast?.rateLimit?.description ||
            'Too many requests. Please try again later.',
          variant: 'destructive',
          className: 'bg-destructive border border-red-600 shadow-md',
        });
      } else {
        throw new Error(result.error || 'Subscription failed');
      }
    } catch (
      // biome-ignore lint/correctness/noUnusedVariables: Error variable needed for type safety
      error: unknown
    ) {
      // Error handling - error variable is used for type safety but we don't need to use it directly in production
      if (error instanceof Error && error.message) {
        toast({
          title: 'Subscription failed',
          description: error.message,
          variant: 'destructive',
          className: 'bg-destructive border border-red-600 shadow-md',
        });
      } else {
        toast({
          title:
            config.jobAlerts.form?.toast?.error?.title ||
            'Something went wrong',
          description:
            config.jobAlerts.form?.toast?.error?.description ||
            'Failed to subscribe to job alerts. Please try again.',
          variant: 'destructive',
          className: 'bg-destructive border border-red-600 shadow-md',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setIsSuccess(false);
  };

  return (
    <div className="mx-auto w-full max-w-md">
      {isSuccess ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6">
          <div className="flex flex-col items-center space-y-3 text-center">
            <CheckCircle className="h-10 w-10 text-green-500" />
            <h3 className="font-semibold text-green-800 text-md">
              {config.jobAlerts.form?.successHeading ||
                'Subscription Confirmed!'}
            </h3>
            <p className="mb-4 text-green-700 text-sm">
              {config.jobAlerts.form?.successDescription ||
                "Thank you for subscribing to job alerts. You'll receive emails when jobs matching your interests are posted."}
            </p>
            <Button
              className="gap-1.5 text-xs"
              onClick={handleReset}
              size="xs"
              variant="outline"
            >
              {config.jobAlerts.form?.resetButtonText ||
                'Subscribe with another email'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border p-5 transition-all hover:border-gray-400">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-medium text-sm" htmlFor="name">
                  {config.jobAlerts.form?.fields?.name?.label || 'Name *'}
                </Label>
                <Input
                  className="h-7 w-full text-xs"
                  disabled={isSubmitting}
                  id="name"
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    config.jobAlerts.form?.fields?.name?.placeholder ||
                    'Your name'
                  }
                  required
                  type="text"
                  value={name}
                />
                {errors.name && (
                  <p className="mt-1 text-red-500 text-sm">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="font-medium text-sm" htmlFor="email">
                  {config.jobAlerts.form?.fields?.email?.label || 'Email *'}
                </Label>
                <Input
                  className="h-7 w-full text-xs"
                  disabled={isSubmitting}
                  id="email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    config.jobAlerts.form?.fields?.email?.placeholder ||
                    'your@email.com'
                  }
                  required
                  type="email"
                  value={email}
                />
                {errors.email && (
                  <p className="mt-1 text-red-500 text-sm">{errors.email}</p>
                )}
              </div>
            </div>
            <Button
              className="w-full gap-1.5 text-xs"
              disabled={isSubmitting}
              size="xs"
              style={{
                backgroundColor: resolveColor(config.ui.primaryColor),
              }}
              type="submit"
              variant="primary"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                  {config.jobAlerts.form?.loadingText || 'Subscribing...'}
                </>
              ) : (
                <>
                  {config.jobAlerts.form?.buttonText ||
                    'Subscribe to Job Alerts'}
                  <ArrowRight aria-hidden="true" className="ml-1 h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
