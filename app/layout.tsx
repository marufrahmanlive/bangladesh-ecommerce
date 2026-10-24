import type { Metadata } from "next";
import { Geist, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const notoBengali = Noto_Sans_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://banglajbazar.example.test"),
  title: {
    default: "BanglaBazar — বাংলাবাজার",
    template: "%s | BanglaBazar",
  },
  description:
    "Demo bilingual ecommerce storefront featuring authentic Bangladeshi products: kantha, clothing, cosmetics and everyday essentials.",
  openGraph: {
    title: "BanglaBazar — বাংলাবাজার",
    description:
      "Authentic Bangladeshi products: handmade kantha, clothing, cosmetics and everyday essentials.",
    type: "website",
    siteName: "BanglaBazar",
    locale: "en_BD",
    alternateLocale: ["bn_BD"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${notoBengali.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

