import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["ui"],
  async headers() {
    return [
      {
        // WebContainers require cross-origin isolation (SharedArrayBuffer).
        source: "/project/:path*",
        headers: [
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
