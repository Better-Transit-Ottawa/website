import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <title>Better Transit Ottawa</title>
      </head>

      <body>{children}</body>
    </html>
  );
}
