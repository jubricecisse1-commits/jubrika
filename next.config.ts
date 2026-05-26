import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Autoriser les packages lourds côté serveur
  serverExternalPackages: ["jspdf", "qrcode"],
};

export default nextConfig;
