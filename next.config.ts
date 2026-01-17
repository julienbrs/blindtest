import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Range' },
          {
            key: 'Access-Control-Expose-Headers',
            value: 'Content-Range, Accept-Ranges',
          },
        ],
      },
    ]
  },
}

export default nextConfig
