/** @type {import('next').NextConfig} */

// 从环境变量读取图片域名（COS/CDN），未配置时用占位符保证本地构建通过
const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;
const imageHost = imageBaseUrl ? new URL(imageBaseUrl).hostname : 'example.com';

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: imageHost,
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
