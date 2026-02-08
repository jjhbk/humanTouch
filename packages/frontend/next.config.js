/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@humanlayer/shared'],
  typescript: {
    // Type checking is done separately via tsc
    ignoreBuildErrors: true,
  },
};
module.exports = nextConfig;
