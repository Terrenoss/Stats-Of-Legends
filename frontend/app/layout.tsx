import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stats Of Legends",
  description: "Une interface moderne inspirée de dpm.lol pour Stats Of Legends, intégrant une analyse de match par IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-[#050505] text-[#A09B8C] selection:bg-lol-red selection:text-white">
        {children}
      </body>
    </html>
  );
}