import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MerchantPlus | Payment Management for Ghana",
  description:
    "MerchantPlus — The complete multi-tenant platform for mobile money agents in Ghana. Manage transactions, teams, customers, and branches in real time.",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo-192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
