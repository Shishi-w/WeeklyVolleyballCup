'use client'
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { useRouter, useSearchParams } from 'next/navigation'
import { FlowerIcon, LoadingIcon } from '@/components/Icons'

function LoginForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
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
        setLoading(true)
        setError('')
        
        try {
            const supabase = createClient()
            
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password
            })
            
            if (error) throw error
            
            window.location.href = callbackUrl
        } catch (err: any) {
            console.error('登录错误:', err)
            
            if (err.message?.includes('Email not confirmed')) {
                setError('账户尚未验证')
            } else if (err.message?.includes('Invalid login credentials')) {
                setError('邮箱或密码错误')
            } else if (err.message?.includes('User not found')) {
                setError('该用户不存在')
            } else {
                setError(err.message || '登录失败，请稍后重试')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-warm-50 via-peach-50 to-cream-100 relative overflow-hidden">
            <div className="fixed top-20 left-10 w-32 h-32 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
            <div className="fixed bottom-20 right-10 w-32 h-32 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '1.5s' }}></div>
            
            <div className="p-8 border rounded-3xl shadow-soft-lg w-96 bg-white/90 backdrop-blur-sm border-pink-100 relative z-10">
                <div className="text-center mb-6">

                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-peach-400">欢迎回来</h1>
                    <p className="text-gray-500 text-sm mt-2">使用邮箱登录</p>
                </div>
                
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm border border-red-100">
                        {error}
                    </div>
                )}
                
                <input
                    type="email"
                    placeholder="请输入邮箱"
                    className="w-full p-3 border-2 border-pink-100 rounded-xl mb-4 focus:border-pink-300 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                />
                <input
                    type="password"
                    placeholder="请输入密码"
                    className="w-full p-3 border-2 border-pink-100 rounded-xl mb-6 focus:border-pink-300 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                />
                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-pink-400 to-peach-400 text-white p-3 rounded-xl hover:shadow-soft hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50"
                >
                    {loading ? '登录中...' : '登录 '}
                </button>
                
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                        还没有账户？{' '}
                        <button
                            onClick={() => router.push('/auth/register')}
                            className="text-pink-500 hover:text-pink-600 font-medium"
                        >
                            立即注册 →
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-warm-50 via-peach-50 to-cream-100">
            <div className="text-center">
                <LoadingIcon className="w-16 h-16 mx-auto mb-4 text-pink-500" />
                <p className="text-gray-600">加载中...</p>
            </div>
        </div>}>
            <LoginForm />
        </Suspense>
    )}
