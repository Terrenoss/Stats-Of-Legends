/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/fr-fr/fr/:path*',
        destination: '/fr-fr/:path*',
        permanent: true
      },
      {
        source: '/en-us/en/:path*',
        destination: '/en-us/:path*',
        permanent: true
      }
    ];
  }
}

module.exports = nextConfig;
