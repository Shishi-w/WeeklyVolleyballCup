// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * 在服务器端使用的 Supabase 客户端。
 * 此客户端配置了 Cookie 处理器，能够安全地读取和写入用户会话。
 * 适用于：Next.js 服务端组件、API 路由、服务器操作中。
 */
export const createClient = async () => {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                // 从请求中获取所有 Cookie
                getAll() {
                    try {
                        return Array.from(cookieStore.getAll())
                    } catch (error) {
                        return []
                    }
                },
                // 设置 Cookie（用于更新会话）
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // 如果 Cookie 在中间件中不可用（如静态生成时），则静默失败
                    }
                },
            },
        }
    )
}
