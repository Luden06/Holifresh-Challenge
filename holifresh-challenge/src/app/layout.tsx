import type { Metadata } from "next";
import { Josefin_Sans, Cabin, Lato } from "next/font/google";
import "./globals.css";

const josefin = Josefin_Sans({
  variable: "--font-josefin",
  subsets: ["latin"],
  weight: ["700"],
});

const cabin = Cabin({
  variable: "--font-cabin",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Sales Challenge | Holifresh",
  description: "Minimal event web app for sales competitions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${josefin.variable} ${cabin.variable} ${lato.variable} font-body antialiased`}>
        {children}
      </body>
    </html>
  );
}
