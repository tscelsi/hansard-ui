/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    typedRoutes: true,
    optimizePackageImports: ['react', 'react-dom'],
  },
};

export default nextConfig;
