'use client';

import { useEffect } from 'react';

// Next.js only calls this for errors thrown in the root layout itself
// (error.tsx can't catch those since it renders inside the layout). It must
// render its own <html>/<body> since the root layout isn't mounted.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled root layout error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          minHeight: '100vh',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '1rem',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Something went wrong</h1>
          <p style={{ maxWidth: '28rem', color: '#666' }}>
            A critical error occurred. Please try reloading the page.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '0.375rem',
              background: '#111',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
