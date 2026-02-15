'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (!key) {
      console.warn('[PostHog] Missing NEXT_PUBLIC_POSTHOG_KEY');
      return;
    }

    if (typeof window !== 'undefined') {
      posthog.init(key, {
        api_host: host || 'https://eu.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: false, // Only track explicit events
        session_recording: {
          recordCrossOriginIframes: false,
        },
      });
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
