import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { Header } from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "IIMS Canteen · IIM Sambalpur", template: "%s · IIMS Canteen" },
  description: "Order from the IIM Sambalpur mess canteen and manage mess inventory.",
  applicationName: "IIMS Canteen",
};

export const viewport: Viewport = {
  themeColor: "#e23744",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en">
      <body className="min-h-screen">
        <CartProvider>
          <Header user={user ? { name: user.name, role: user.role } : null} />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
