import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: ".next-build",
  outputFileTracingExcludes: {
    "/*": ["./work/**/*", "./outputs/**/*", "./.next/**/*"],
  },
};

export default nextConfig;
