import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: { "/api/configurations/*/pdf": ["./public/fonts/Geist-Regular.ttf", "./public/**/*.svg"] },
};
export default nextConfig;
