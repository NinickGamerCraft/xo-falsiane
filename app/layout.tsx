import "./globals.css";
import VLibras from "./vlibras";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Xô, falsiane! | Detector de Fake News",
  description:
    "Ferramenta educativa para análise de notícias, perguntas e links suspeitos.",
  icons: {
    icon: [
      {
        url: "/icons/xo-falsiane.png?v=2",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    shortcut: "/icons/xo-falsiane.png?v=2",
    apple: "/icons/xo-falsiane.png?v=2",
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <VLibras />
      </body>
    </html>
  );
}