'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/browser';
import { FlowerIcon, LoadingIcon } from '@/components/Icons';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少为 6 位');
      setLoading(false);
      return;
    }

    if (!username || username.trim() === '') {
      setError('请输入用户名');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.trim(),
          },
        },
      });

      if (error) {
        console.error('注册错误详情:', error);
        throw error;
      }

      console.log('注册成功:', data);
      alert('注册成功！');
      router.push('/auth/login');
    } catch (err: any) {
      console.error('注册失败:', err);
      setError(err.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-warm-50 via-peach-50 to-cream-100 relative overflow-hidden">
      {/* 装饰背景 */}
      <div className="fixed top-20 right-10 w-32 h-32 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
      <div className="fixed bottom-20 left-10 w-32 h-32 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '1.5s' }}></div>
      
      <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-3xl shadow-soft-lg p-8 border-2 border-pink-100 relative z-10">
        <div className="text-center mb-8">

          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-peach-400 mb-2">
            创建账户
          </h2>
          <p className="text-gray-600">
            加入我们，开始使用
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              用户名
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-200 focus:border-pink-300 transition-all outline-none"
              placeholder="请输入用户名（球友们会看到这个名字）"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              邮箱
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-200 focus:border-pink-300 transition-all outline-none"
              placeholder="请输入邮箱地址（用于登录）"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-200 focus:border-pink-300 transition-all outline-none"
              placeholder="请输入密码（至少 6 位）"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              确认密码
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-200 focus:border-pink-300 transition-all outline-none"
              placeholder="请再次输入密码"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-400 to-peach-400 text-white py-3 rounded-xl hover:shadow-soft hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg border border-white/50"
          >
            {loading ? (
              <>
                <LoadingIcon className="inline-block w-6 h-6 mr-2 text-white" /> 注册中...
              </>
            ) : (
              '注册'
            )}

          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          已有账号？{' '}
          <Link href="/auth/login" className="text-pink-500 hover:text-pink-600 font-medium">
            立即登录 →
          </Link>
        </p>
      </div>
    </div>
  );
}
