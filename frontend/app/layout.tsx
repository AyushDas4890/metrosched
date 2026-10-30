import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

const barlow = Barlow({ variable: "--font-barlow", subsets: ["latin"], weight: ["400", "500", "600"] });
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MetroSched",
  description: "Nightly train induction planning for a metro depot (synthetic data, CSE 471 project)",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${barlow.variable} ${barlowCondensed.variable} font-sans antialiased`}>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:bg-card focus:p-2">
          Skip to content
        </a>
        <div className="flex min-h-screen flex-col md:flex-row">
          <Sidebar />
          <main id="main" className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-8">
            <p
              role="note"
              className="mb-6 rounded-md border border-standby/40 bg-standby/10 px-3 py-2 text-sm text-foreground"
            >
              All train data shown here is synthetic. It does not reflect real KMRL operations.
            </p>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
