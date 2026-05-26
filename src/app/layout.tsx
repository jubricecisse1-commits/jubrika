import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

export const metadata: Metadata = {
  title: "JUBRIKA — Luxe Valeur Impact",
  description: "Application de gestion commerciale JUBRIKA",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="bg-black text-white antialiased">
        <AuthProvider>
          <LanguageProvider>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#1a1a1a",
                  color: "#fff",
                  border: "1px solid #C9960C",
                  borderRadius: "12px",
                  fontFamily: "Inter, sans-serif",
                },
                success: { iconTheme: { primary: "#C9960C", secondary: "#000" } },
                error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
              }}
            />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
