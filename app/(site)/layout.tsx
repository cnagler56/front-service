import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./../globals.css";
import Header from "@/src/components/Header/header";
import { NavigationBar } from "@/src/components/NavigationBar/navigationBar";
import Footer from "@/src/components/Footer/Footer";
import { UserProvider } from "@/src/lib/UserContext";
import ServiceWorkerRegister from "@/src/components/pwa/ServiceWorkerRegister";
import InstallPrompt from "@/src/components/pwa/InstallPrompt";
import { Analytics } from "@vercel/analytics/next";
import { OPEN_GRAPH_BASE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/src/lib/seo";

/** Tells search engines the site's name (shown above results) and who runs it. */
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: SITE_NAME, description: SITE_DESCRIPTION },
    { "@type": "Organization", "@id": `${SITE_URL}/#organization`, url: SITE_URL, name: SITE_NAME, logo: `${SITE_URL}/icons/icon-512.png` },
  ],
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: OPEN_GRAPH_BASE,
  twitter: { card: "summary" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Just4Ag",
  },
};

export const viewport: Viewport = {
  themeColor: "#2c4a1e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <UserProvider>
          <ServiceWorkerRegister />
          <InstallPrompt />
          <Header />
          <NavigationBar />
          {children}
          <Footer />
        </UserProvider>
        <Analytics />
      </body>
    </html>
  );
}
