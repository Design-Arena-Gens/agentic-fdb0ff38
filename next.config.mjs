/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nyc3.digitaloceanspaces.com'
      },
      {
        protocol: 'https',
        hostname: 'imagineexplainers.com'
      }
    ]
  }
};

export default nextConfig;
