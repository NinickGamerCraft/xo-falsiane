import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Xô, falsiane!",
    short_name: "Xô, falsiane!",
    description:
      "Detector educativo de fake news com IA e acesso ao jogo Space News.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#050914",
    theme_color: "#0b1f4d",
    categories: ["education", "news", "utilities"],
    icons: [
      {
        src: "/icons/xo-falsiane-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/xo-falsiane-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/xo-falsiane-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/xo-falsiane-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Analisar uma informação",
        short_name: "Analisar",
        url: "/",
        icons: [
          {
            src: "/icons/xo-falsiane-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "Abrir Space News",
        short_name: "Space News",
        url: "/jogo",
        icons: [
          {
            src: "/icons/space-news-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    ],
  };
}
