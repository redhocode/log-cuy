/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: "build",
  logging: {
    fetches: {
      hmrRefreshes: true,
    },
  },
  // Tambahkan ini untuk development
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Pastikan output untuk development
  // output: 'standalone', // Hapus jika tidak perlu
};

export default nextConfig;