import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/jogo",
    name: "Space News",
    short_name: "Space News",
    description: "Shoot'em up retrô contra a desinformação.",
    start_url: "/jogo?source=pwa",
    scope: "/jogo",
    display: "standalone",
    orientation: "landscape",
    background_color: "#090611",
    theme_color: "#201038",
    categories: ["games", "education"],
    icons: [
      {
        src: "/icons/space-news-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/space-news-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/space-news-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/space-news-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
