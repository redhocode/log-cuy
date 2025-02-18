/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: "build",
  logging: {
    fetches: {
      hmrRefreshes: true,
    },
  },
};

export default nextConfig;
