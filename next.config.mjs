/** @type {import('next').NextConfig} */
const nextConfig = {
  // 输出为独立 Node.js 服务器（可选，适用于某些部署场景）
  output: 'standalone',
  
  // 启用 React 严格模式
  reactStrictMode: true,
};

export default nextConfig;
