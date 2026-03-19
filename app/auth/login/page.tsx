'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const supabase = createClient()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [callbackUrl, setCallbackUrl] = useState('/timeline')

    useEffect(() => {
        const callbackUrlParam = searchParams.get('callbackUrl')
        if (callbackUrlParam && callbackUrlParam.startsWith('/')) {
            setCallbackUrl(callbackUrlParam)
        }
    }, [searchParams])

    const handleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password
            });
            
            if (error) throw error;
            
            // 强制刷新当前页面的认证状态
            window.location.href = callbackUrl
        } catch (err: any) {
            console.error('登录错误:', err)
            let errorMessage = '登录失败'
            
            if (err.message?.includes('Email not confirmed')) {
                errorMessage = '邮箱尚未验证，请检查邮箱并点击验证链接'
            } else if (err.message?.includes('Invalid login credentials')) {
                errorMessage = '邮箱或密码错误'
            } else if (err.message?.includes('User not found')) {
                errorMessage = '该邮箱未注册'
            } else {
                errorMessage = err.message || '登录失败，请稍后重试'
            }
            
            setError(errorMessage)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="p-8 border rounded-lg shadow-lg w-96">
                <h1 className="text-2xl font-bold mb-6">登录</h1>
                
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}
                
                <input
                    type="email"
                    placeholder="邮箱"
                    className="w-full p-2 border rounded mb-4"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="密码"
                    className="w-full p-2 border rounded mb-6"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button
                    onClick={handleLogin}
                    className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                >
                    登录
                </button>
            </div>
        </div>
    )
}
