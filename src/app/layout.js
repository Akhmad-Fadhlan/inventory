import { Inter, Nunito } from 'next/font/google';
import Providers from '@/components/Providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata = {
  title: 'SISMA — Sistem Inventaris Manajemen Aset Sekolah',
  description:
    'Aplikasi manajemen inventaris dan aset sekolah yang modern, efisien, dan terpercaya.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${inter.variable} ${nunito.variable}`} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
