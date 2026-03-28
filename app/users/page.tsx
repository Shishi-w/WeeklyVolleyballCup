'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';
import Link from 'next/link';
import { UsersIcon, FlowerIcon, LoadingIcon } from '@/components/Icons';

type Profile = {
  id: string;
  username: string;
  created_at: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const supabase = createClient();

  useEffect(() => {
    checkUser();
    fetchUsers();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        return;
      }
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (data) {
          setCurrentUser(data);
        }
      }
    } catch (error) {
      console.error('检查用户状态失败:', error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        alert('请先登录');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      alert('获取用户列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fbcfe8 100%)'
      }}
    >

      {/* 背景层 - 四张水彩插画人物 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* 左侧上方人物 - 举手击球 */}
        <div
          className="absolute top-[0%] left-[-5%] opacity-12 sm:opacity-15 md:opacity-20"
          style={{
            width: '55vw',
            maxWidth: '400px',
            filter: 'drop-shadow(0 0 30px rgba(253,186,116,0.3))'
          }}
        >
          <img
            src="/volleyball-player-4.png"
            alt="Volleyball Player 4"
            className="w-full h-auto"
            style={{
              objectFit: 'contain'
            }}
          />
        </div>

        {/* 右侧上方人物 - 网前垫球 */}
        <div
          className="absolute top-[20%] right-[5%] opacity-12 sm:opacity-15 md:opacity-20"
          style={{
            width: '55vw',
            maxWidth: '380px',
            filter: 'drop-shadow(0 0 30px rgba(253,186,116,0.3))'
          }}
        >
          <img
            src="/volleyball-player-2.png"
            alt="Volleyball Player 2"
            className="w-full h-auto"
            style={{
              objectFit: 'contain'
            }}
          />
        </div>

        {/* 中间左侧人物 - 第三张 */}
        <div
          className="absolute top-[50%] left-[-5%] opacity-12 sm:opacity-15 md:opacity-20"
          style={{
            width: '55vw',
            maxWidth: '360px',
            filter: 'drop-shadow(0 0 30px rgba(253,186,116,0.3))'
          }}
        >
          <img
            src="/volleyball-player-3.png"
            alt="Volleyball Player 3"
            className="w-full h-auto"
            style={{
              objectFit: 'contain'
            }}
          />
        </div>

        {/* 中间右侧人物 - 第四张 */}
        <div
          className="absolute top-[65%] right-[-5%] opacity-12 sm:opacity-15 md:opacity-20"
          style={{
            width: '55vw',
            maxWidth: '400px',
            filter: 'drop-shadow(0 0 30px rgba(253,186,116,0.3))'
          }}
        >
          <img
            src="/volleyball-player-1.png"
            alt="Volleyball Player 1"
            className="w-full h-auto"
            style={{
              objectFit: 'contain'
            }}
          />
        </div>

        {/* 中间的装饰元素 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-[60vw] h-[60vh] rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, rgba(251,207,232,0.5) 0%, transparent 70%)'
            }}
          />
        </div>

        {/* 装饰性线条 */}
        <svg className="absolute inset-0 w-full h-full opacity-10" style={{ pointerEvents: 'none' }}>
          <defs>
            <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde68a" stopOpacity="0" />
              <stop offset="50%" stopColor="#fde68a" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M 0,100 Q 400,300 800,100 T 1600,100"
            fill="none"
            stroke="url(#lineGradient1)"
            strokeWidth="2"
          />
          <path
            d="M 0,500 Q 400,700 800,500 T 1600,500"
            fill="none"
            stroke="url(#lineGradient1)"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* 网格背景 */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>

      {/* 内容区域 */}
      <div className="container mx-auto px-4 py-12 relative z-10">

        {/* 返回按钮 */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm text-gray-900 rounded-2xl font-medium shadow-lg border border-white/50 hover:shadow-xl hover:bg-white transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>返回首页</span>
          </Link>
        </div>

        {/* 页面标题 */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50">
              <UsersIcon className="w-10 h-10 text-indigo-600" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-700 mb-4">
            球友列表
          </h1>
          <p className="text-xl text-gray-600">
           已有 {users.length} 位球友加入社区
          </p>
        </div>

        {/* 用户列表 */}
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <LoadingIcon className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
                <p className="text-gray-600">加载中...</p>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <FlowerIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无球友</h3>
              <p className="text-gray-500">快来成为第一个加入的球友吧！</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {users.map((user, index) => (
                <div
                  key={user.id}
                  className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-white/50"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {(user.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {user.username || '未设置用户名'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        球友 #{index + 1}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>加入时间: {user.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '未知'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
