import type { MetadataRoute } from "next";

/**
 * Web app manifest — Next serves this at /manifest.webmanifest and auto-injects
 * the <link rel="manifest"> tag. Makes the site installable ("Add to Home
 * Screen") with a standalone, app-like window. Icons live in /public/icons.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Just4Ag — Markets & Weather",
    short_name: "Just4Ag",
    description:
      "Agricultural commodity markets, USDA reports, and weather for farmers.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f0e8",
    theme_color: "#2c4a1e",
    categories: ["business", "finance", "weather", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
