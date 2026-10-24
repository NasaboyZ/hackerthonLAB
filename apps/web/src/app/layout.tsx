import type { Metadata } from "next";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
import Navigation from "@/components/navigation";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../messages/de.json";

export const metadata: Metadata = {
  title: "Magnetrail",
  description: "Magnet fishing exploration platform",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>
        <NextIntlClientProvider locale="de" messages={messages}>
          <Navigation />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

