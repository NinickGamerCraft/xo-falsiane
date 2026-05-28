import "./globals.css";

export const metadata = {
  title: "Xô, falsiane! | Detector de Fake News",
  description: "Verifique notícias, links e informações suspeitas com IA.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}