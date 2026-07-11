import type { NextConfig } from "next";
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";

const nextConfig: NextConfig = {
  // Prisma's query engine binary is loaded via a dynamically-computed path,
  // which Vercel's output file tracing can't follow statically in a
  // pnpm-hoisted monorepo. Prisma's own webpack plugin copies the binary
  // next to the bundle instead of relying on trace detection.
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }
    return config;
  },
};

export default nextConfig;
