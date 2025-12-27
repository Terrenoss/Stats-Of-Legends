import type { Metadata } from "next";
import { Inter, Cinzel } from "next/font/google";
import "./globals.css";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { LanguageProvider } from "./LanguageContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stats Of Legends",
  description: "Une interface moderne inspirée de dpm.lol pour Stats Of Legends, intégrant une analyse de match par IA.",
};

const MAIN_BG_COLOR = '#050505';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body suppressHydrationWarning={true} className={`${inter.variable} ${cinzel.variable} antialiased bg-[${MAIN_BG_COLOR}] text-[#A09B8C] selection:bg-lol-red selection:text-white min-h-screen flex flex-col font-sans`}>
        <LanguageProvider>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
