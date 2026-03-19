/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用 React 严格模式（有助于发现潜在问题）
  reactStrictMode: true,

  // 优化构建性能
  swcMinify: true,

  // 确保环境变量正确传递到客户端
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  // 配置 Webpack（可选，用于处理某些特殊情况）
  webpack: (config) => {
    // 解决某些依赖的兼容性问题
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

export default nextConfig;
