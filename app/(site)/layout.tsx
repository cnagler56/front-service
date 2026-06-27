import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./../globals.css";
import Header from "@/src/components/Header/header";
import { NavigationBar } from "@/src/components/NavigationBar/navigationBar";
import Footer from "@/src/components/Footer/Footer";
import { UserProvider } from "@/src/lib/UserContext";
import ServiceWorkerRegister from "@/src/components/pwa/ServiceWorkerRegister";
import InstallPrompt from "@/src/components/pwa/InstallPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "Just4Ag",
  title: "Just4Ag",
  description: "Agricultural commodity markets, USDA reports, and weather for farmers.",
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
        <UserProvider>
          <ServiceWorkerRegister />
          <InstallPrompt />
          <Header />
          <NavigationBar />
          {children}
          <Footer />
        </UserProvider>
      </body>
    </html>
  );
}
