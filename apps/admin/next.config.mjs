
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@refinedev/antd"],
  output: "export",
  distDir: "dist",
  images: {
    unoptimized: true,
  }
};

export default nextConfig;
