import '@/styles/globals.css';
import { AuthProvider } from '@/context/AuthContext.jsx';
import I18nProvider from '@/components/I18nProvider.jsx';
import PWAUpdater from '@/components/PWAUpdater.jsx';
import PostHogProvider from '@/components/PostHogProvider.jsx';

export const metadata = {
  title: 'Norevify',
  description: 'Track every kilometer.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" />
        <meta name="theme-color" content="#07101a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Norevify" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <PostHogProvider>
          <I18nProvider>
            <AuthProvider>
              <PWAUpdater />
              {children}
            </AuthProvider>
          </I18nProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
