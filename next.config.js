/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    serverActions: {
      // Server Actions already enforce same-origin checks; this caps body size for payment/withdrawal forms.
      bodySizeLimit: '1mb',
    },
  },
};

module.exports = nextConfig;
