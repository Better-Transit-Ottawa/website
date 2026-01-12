import { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// eslint-disable-next-line 
const frutiger = localFont({
  src: [{
    path: "../../public/Frutiger.ttf",
  }],
});

// eslint-disable-next-line
const frutigerBold = localFont({
  src: [{
    path: "../../public/Frutiger_bold.ttf",
  }],
});

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={"dark"}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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