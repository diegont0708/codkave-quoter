import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CodKave Quoter',
  description: 'Professional web design services — quote builder by CodKave Australia',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={poppins.variable}>
      <body>
        {children}
      </body>
    </html>
  );
}
