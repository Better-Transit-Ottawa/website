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

        {/* <title>{title ?? "Better Transit Ottawa"}</title> */}
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