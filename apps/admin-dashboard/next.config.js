/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ecommerce/ui', '@ecommerce/types', '@ecommerce/utils', '@ecommerce/api-client'],
};

module.exports = nextConfig;
