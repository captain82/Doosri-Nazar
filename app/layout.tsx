import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  style: ["normal", "italic"],
  axes: ["opsz"],
});

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Doosri Nazar — AI user testing for non-urban India",
  description:
    "Upload a flow, and AI users grounded in non-urban India — throttled connections, shared phones, first smartphones, five languages — walk through it and tell you where it breaks.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${plex.variable} font-body bg-paper text-ink antialiased`}>
        {children}
      </body>
    </html>
  );
}
