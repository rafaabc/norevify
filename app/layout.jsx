export const metadata = {
  title: 'Drive Ledger',
  description: 'Track every kilometer.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
