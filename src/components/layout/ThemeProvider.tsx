"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

const ACCENT_HSL = {
  blue: "221 83% 53%",
  purple: "258 90% 66%",
  pink: "330 81% 60%",
  red: "0 84% 60%",
  orange: "24 95% 53%",
  yellow: "45 93% 47%",
  green: "142 71% 45%",
  teal: "173 80% 40%",
};

function hexToHsl(hex: string): string {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) hex = hex.split("").map((x) => x + x).join("");
  if (hex.length !== 6) return ACCENT_HSL.blue;

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const user = useAuthStore((s) => s.user);
  const accentName = user?.accentColor || "blue";
  const hsl =
    ACCENT_HSL[accentName as keyof typeof ACCENT_HSL] ||
    (accentName.startsWith("#") ? hexToHsl(accentName) : ACCENT_HSL.blue);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `:root:root { --primary: ${hsl}; --ring: ${hsl}; } .dark:root { --primary: ${hsl}; --ring: ${hsl}; }`,
        }}
      />
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "hsl(var(--card))",
            color: "hsl(var(--card-foreground))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.75rem",
            fontSize: "0.875rem",
            padding: "0.75rem 1rem",
            boxShadow:
              "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          },
          success: {
            iconTheme: {
              primary: "hsl(var(--success))",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "hsl(var(--destructive))",
              secondary: "#fff",
            },
          },
        }}
      />
    </NextThemesProvider>
  );
}
