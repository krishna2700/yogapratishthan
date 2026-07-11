import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma's query engine binary is loaded via a dynamically-computed path,
  // which Vercel's output file tracing can't follow statically — especially
  // in a pnpm-hoisted monorepo. Marking it external makes Next treat it as
  // a plain runtime require, so the whole package (binary included) ships.
  serverExternalPackages: ["@prisma/client", "@yogapratishthan/db"],
};

export default nextConfig;
