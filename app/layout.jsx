import '@/styles/globals.css';
import { AuthProvider } from '@/context/AuthContext.jsx';
import I18nProvider from '@/components/I18nProvider.jsx';

export const metadata = {
  title: 'Drive Ledger',
  description: 'Track every kilometer.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <I18nProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
