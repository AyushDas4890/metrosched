import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const barlow = Barlow({ variable: "--font-barlow", subsets: ["latin"], weight: ["400", "500", "600"] });
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MetroSched",
  description: "Nightly train induction planning for a metro depot (synthetic planning data, real MetroPT-3 compressor data; CSE 471 project)",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${barlow.variable} ${barlowCondensed.variable} font-sans antialiased`}>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-card focus:p-2">
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
