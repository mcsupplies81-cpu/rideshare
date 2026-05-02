import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rideo — Better Rides. More Earnings.",
  description:
    "Rideo connects riders with trusted drivers in San Diego and gives drivers more of what they earn.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#0F0F1A] text-white">
        {children}
      </body>
    </html>
  );
}
