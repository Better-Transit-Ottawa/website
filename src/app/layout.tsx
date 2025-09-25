import { Metadata } from "next";
import "./globals.css";

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <link rel="preload" as="font" href="/Frutiger.ttf" type="font/ttf"></link>
        <link rel="preload" as="font" href="/Frutiger_bold.ttf" type="font/ttf"></link>
      </head>

      <body>{children}</body>
    </html>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Better Transit Ottawa"
  };
}