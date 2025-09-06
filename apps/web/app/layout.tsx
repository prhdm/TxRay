import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "../src/components/providers";
import { NotificationContainer } from "@txray/ui";

const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "TxRay - Rarity Collection",
  description: "A modern rarity collection management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} font-sans`}>
        <Providers>
          {children}
        </Providers>
        <NotificationContainer />
      </body>
    </html>
  );
}
