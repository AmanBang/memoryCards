import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Memory Card Game",
  description: "A multiplayer memory card game with 3D animations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-900">{children}</body>
    </html>
  );
}
