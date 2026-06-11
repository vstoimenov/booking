import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingExcludes: {
    "/*": ["./work/**/*", "./outputs/**/*"],
  },
};

export default nextConfig;
