'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

const ACCENT_HSL = {
  blue: '221 83% 53%',
  purple: '258 90% 66%',
  pink: '330 81% 60%',
  red: '0 84% 60%',
  orange: '24 95% 53%',
  yellow: '45 93% 47%',
  green: '142 71% 45%',
  teal: '173 80% 40%',
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const user = useAuthStore((s) => s.user);
  const accentName = user?.accentColor || 'blue';
  const hsl = ACCENT_HSL[accentName as keyof typeof ACCENT_HSL] || ACCENT_HSL.blue;

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <style dangerouslySetInnerHTML={{ __html: `:root { --primary: ${hsl}; --ring: ${hsl}; } .dark { --primary: ${hsl}; --ring: ${hsl}; }` }} />
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
