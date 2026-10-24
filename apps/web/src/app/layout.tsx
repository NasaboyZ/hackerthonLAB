import type { Metadata } from "next";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
import Navigation from "@/components/navigation";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../messages/de.json";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Magnetrail",
  description: "Magnet fishing exploration platform",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={cn("font-sans", geist.variable)}>
      <body>
        <NextIntlClientProvider locale="de" messages={messages}>
          <Navigation />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

