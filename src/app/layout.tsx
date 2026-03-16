import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hash Mahjong — Injective EVM Mini Game',
  description: 'A blockchain-based Mahjong game on Injective EVM',
  other: { 'theme-color': '#2b170d' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
