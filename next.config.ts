
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  
  allowedDevOrigins: ['https://*.cloudworkstations.dev', '*.cloudworkstations.dev'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
