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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7B5EA7" />
      </head>
      <body className="min-h-full flex flex-col bg-[#0F0F1A] text-white">
        {children}
      </body>
    </html>
  );
}
