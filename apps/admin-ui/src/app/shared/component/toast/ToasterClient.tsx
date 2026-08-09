'use client';

import { Toaster } from 'react-hot-toast';

export function ToasterClient() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3500,
        style: {
          background: '#1e293b',
          color: '#fff',
          fontSize: '14px',
        },
        success: {
          iconTheme: { primary: '#10b981', secondary: '#fff' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#fff' },
        },
      }}
    />
  );
}