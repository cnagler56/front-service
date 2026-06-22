import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./../globals.css";
import Header from "@/src/components/Header/header";
import { NavigationBar } from "@/src/components/NavigationBar/navigationBar";
import Footer from "@/src/components/Footer/Footer";
import { UserProvider } from "@/src/lib/UserContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Just4Ag",
  description: "Just4Ag",
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
          <Header />
          <NavigationBar />
          {children}
          <Footer />
        </UserProvider>
      </body>
    </html>
  );
}
