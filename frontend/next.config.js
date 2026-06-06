/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http',  hostname: 'localhost' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  env: {
    NEXT_PUBLIC_API_URL:     process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SOCKET_URL:  process.env.NEXT_PUBLIC_SOCKET_URL,
    NEXT_PUBLIC_STRIPE_KEY:  process.env.NEXT_PUBLIC_STRIPE_KEY,
  },
};

module.exports = nextConfig;
