import type { Metadata } from 'next';
import { PendingRoutedModalHost, ThemeProvider } from '@design-system';
import { AuthProvider } from '@auth/context/AuthProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fish',
  description: 'Fish test app — Next.js UI scaffolded from UI.NextJs.Framework',
};

/**
 * Root shell. AuthProvider stays in the tree so entity-framework hooks that call useAuth()
 * keep working; this app has no sign-in and starts with a null session (T-SETUP-002).
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('system-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            {children}
            {/* Instant modal shell + loader while a routed modal's route loads. */}
            <PendingRoutedModalHost />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
