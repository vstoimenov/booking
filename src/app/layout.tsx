import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LocalOps White Label",
  description:
    "SaaS основа за резервации, CRM и последваща комуникация за локални услуги под собствен бранд.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
