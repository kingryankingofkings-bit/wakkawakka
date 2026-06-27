'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
            padding: '0.75rem 1rem',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
          success: {
            iconTheme: {
              primary: 'hsl(var(--success))',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: 'hsl(var(--destructive))',
              secondary: '#fff',
            },
          },
        }}
      />
    </NextThemesProvider>
  );
}
