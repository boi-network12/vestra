import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastContainer } from "react-toastify";
import { UserProvider } from "@/context/UserContext";
import { FriendProvider } from "@/context/FriendContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vestra App",
  description: "Social App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <FriendProvider>
          <AuthProvider>
            <UserProvider>
                {children}
                <ToastContainer />
            </UserProvider>
          </AuthProvider>
        </FriendProvider>
      </body>
    </html>
  );
}
// app/layout.tsx