import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'QuIDE — Quantum IDE',
  description: 'A browser-based Quantum Computing IDE powered by Qiskit Aer',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gh-canvas text-gh-text antialiased font-mono">
        {children}
      </body>
    </html>
  );
}
