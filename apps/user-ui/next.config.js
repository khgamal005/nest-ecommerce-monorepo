/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { useTypeScriptCli: true },
  reactStrictMode: true,
  transpilePackages: ['@ecommerce/ui', '@ecommerce/types', '@ecommerce/utils', '@ecommerce/api-client'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

module.exports = nextConfig;
