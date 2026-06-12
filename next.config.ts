import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    outputFileTracingIncludes: {
          "/*": ["./node_modules/next/dist/lib/framework/**/*"],
    },
    outputFileTracingExcludes: {
          "/*": ["./work/**/*", "./outputs/**/*"],
    },
};

export default nextConfig;
