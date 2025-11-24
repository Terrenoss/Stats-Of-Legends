import '../styles/globals.css';
import React from 'react';

export const metadata = {
  title: 'LoL Builder MVP',
  description: 'Minimal builder'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
