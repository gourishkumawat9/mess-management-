import type { MetadataRoute } from "next";

// Lets students "Add to Home Screen" so the canteen opens like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IIMS Canteen · IIM Sambalpur",
    short_name: "IIMS Canteen",
    description: "Order from the IIM Sambalpur mess canteen.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#e23744",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
