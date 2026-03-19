import { createBrowserClient } from '@supabase/ssr'

/**
 * 在浏览器端使用的 Supabase 客户端。
 * 此函数在每次调用时返回一个新的、独立的客户端实例。
 * 适用于：React 客户端组件、事件处理器、效果钩子（useEffect）中。
 */
export const createClient = () =>
    createBrowserClient(
        // 从环境变量读取 Supabase URL
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        // 从环境变量读取 Supabase 匿名密钥
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )