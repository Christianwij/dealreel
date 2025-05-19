/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['create-images-results.d-id.com'],
  },
  webpack: (config) => {
    config.externals = [...config.externals, 'canvas', 'jsdom'];
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['canvas', 'jsdom'],
  },
}

export default nextConfig; 