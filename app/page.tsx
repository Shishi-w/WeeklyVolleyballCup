'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';
import Link from 'next/link';
import { VolleyballIcon, CalendarIcon, UsersIcon, FlowerIcon, StarIcon, LoadingIcon } from '@/components/Icons';

type User = {
  id: string;

  username: string;
  user_metadata: {
    username?: string;
  };
  created_at: string;
};

export default function Home() {
  const [showUsers, setShowUsers] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // 使用 Supabase Admin API 获取用户列表
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        alert('请先登录');
        return;
      }

      // 查询 profiles 表获取用户信息
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;
      setUsers(data || []);
      setShowUsers(true);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      alert('获取用户列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-warm-50 via-peach-50 to-cream-100">
        {/* 装饰性背景元素 */}
        <div className="fixed top-20 left-10 w-32 h-32 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="fixed top-40 right-10 w-32 h-32 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="fixed bottom-20 left-1/2 w-32 h-32 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-16 relative z-10">
          {/* Hero Section */}
          <div className="text-center mb-12 sm:mb-20">
            <div className="inline-block mb-6">
              <VolleyballIcon className="w-24 h-24 sm:w-32 sm:h-32 mx-auto animate-float" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-peach-400 to-pink-500 mb-4 sm:mb-6 leading-tight drop-shadow-sm">
              Weekly Volleyball Cup
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 sm:mb-12 px-2 font-light">
              不专业的排球赛事管理平台
            </p>

            {!showUsers ? (
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4">
                  <Link
                      href="/timeline"
                      className="group bg-gradient-to-r from-pink-400 to-peach-400 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-2xl text-base sm:text-lg font-semibold hover:shadow-soft-lg hover:scale-105 transition-all duration-300 w-full sm:w-auto border border-white/50"
                  >
                    赛事时间轴
                    <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                  <button
                      onClick={fetchUsers}
                      disabled={loading}
                      className="group bg-white text-pink-500 px-8 sm:px-10 py-3 sm:py-4 rounded-2xl text-base sm:text-lg font-semibold hover:bg-pink-50 hover:shadow-soft transition-all duration-300 disabled:opacity-50 w-full sm:w-auto border-2 border-pink-200"
                  >
                    {loading ? (
                      <>
                        <span className="inline-block animate-spin mr-2"></span> 加载中...
                      </>
                    ) : (
                      <>查看球友列表</>
                    )}
                  </button>
                </div>
            ) : (
                <div className="flex gap-4 sm:gap-6 justify-center px-4">
                  <button
                      onClick={() => setShowUsers(false)}
                      className="bg-white text-gray-700 px-8 sm:px-10 py-3 sm:py-4 rounded-2xl text-base sm:text-lg font-semibold hover:bg-pink-50 hover:shadow-soft transition-all duration-300 w-full sm:w-auto border-2 border-pink-100"
                  >
                    返回首页
                  </button>
                </div>
            )}
          </div>

          {/* User List Section */}
          {showUsers && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-soft-lg p-6 sm:p-8 md:p-10 border border-pink-100">
                  <div className="text-center mb-8">
                    <UsersIcon className="w-16 h-16 mx-auto mb-4" />
                    <h2 className="text-2xl sm:text-3xl font-bold text-pink-600 mb-2">
                      球友列表
                    </h2>

                    <p className="text-gray-600 text-xs sm:text-sm mt-4">
                      已有 {users.length} 位球友加入
                    </p>
                  </div>

                  {loading ? (
                      <div className="text-center py-10 sm:py-16">
                        <LoadingIcon className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-pink-500" />
                        <p className="text-gray-600 mt-4 sm:mt-6 text-sm sm:text-base">加载中...</p>
                      </div>
                  ) : users.length === 0 ? (
                      <div className="text-center py-10 sm:py-16">
                        <FlowerIcon className="text-5xl mb-4 block mx-auto w-16 h-16 sm:w-20 sm:h-20" />
                        <p className="text-gray-600 text-sm sm:text-base">暂无球友，快来成为第一个吧！</p>
                      </div>
                  ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                          <tr className="border-b-2 border-pink-100">
                            <th className="text-left py-3 sm:py-4 px-2 sm:px-4 text-pink-600 font-semibold text-xs sm:text-sm">#</th>
                            <th className="text-left py-3 sm:py-4 px-2 sm:px-4 text-pink-600 font-semibold text-xs sm:text-sm">用户名</th>
                            <th className="text-right py-3 sm:py-4 px-2 sm:px-4 pr-12 sm:pr-16 text-pink-600 font-semibold text-xs sm:text-sm">加入时间</th>
                          </tr>
                          </thead>
                          <tbody>
                          {users.map((user, index) => (
                              <tr key={user.id} className="border-b border-pink-50 hover:bg-pink-50/50 transition-colors">
                                <td className="py-3 sm:py-4 px-2 sm:px-4 text-gray-600 text-xs sm:text-sm">{index + 1}</td>
                                <td className="py-3 sm:py-4 px-2 sm:px-4 text-gray-700 text-xs sm:text-sm break-all">
                                  <span className="inline-flex items-center gap-1">
                                    <UsersIcon className="w-5 h-5 text-pink-400" />
                                    {user.username || '未设置用户名'}
                                  </span>
                                </td>

                                <td className="text-right py-3 sm:py-4 px-2 sm:px-4 pr-8 sm:pr-12 text-gray-600 text-xs sm:text-sm whitespace-nowrap">
                                  {user.created_at ? new Date(user.created_at).toLocaleString('zh-CN') : '-'}
                                </td>
                              </tr>
                          ))}
                          </tbody>
                        </table>
                      </div>
                  )}
                </div>
              </div>
          )}

          {/* Features Section */}
          {!showUsers && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10 mt-12 sm:mt-16 md:mt-24">
                <div className="group bg-white/90 backdrop-blur-sm p-6 sm:p-8 md:p-10 rounded-3xl shadow-soft hover:shadow-soft-lg hover:-translate-y-2 transition-all duration-300 border border-pink-100">
                  <div className="mb-4 sm:mb-6 text-center group-hover:scale-110 transition-transform duration-300">
                    <CalendarIcon className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-pink-600 mb-3 sm:mb-4 text-center">赛事时间轴</h3>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed text-center">
                    快速了解赛事进程
                  </p>
                </div>

                <div className="group bg-white/90 backdrop-blur-sm p-6 sm:p-8 md:p-10 rounded-3xl shadow-soft hover:shadow-soft-lg hover:-translate-y-2 transition-all duration-300 border border-pink-100">
                  <div className="mb-4 sm:mb-6 text-center group-hover:scale-110 transition-transform duration-300">
                    <VolleyballIcon className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-pink-600 mb-3 sm:mb-4 text-center">赛事详情</h3>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed text-center">
                    查看周赛主题、规则和参赛队伍信息，支持更新赛果、上传照片和照片评论功能
                  </p>
                </div>

                <div className="group bg-white/90 backdrop-blur-sm p-6 sm:p-8 md:p-10 rounded-3xl shadow-soft hover:shadow-soft-lg hover:-translate-y-2 transition-all duration-300 border border-pink-100">
                  <div className="mb-4 sm:mb-6 text-center group-hover:scale-110 transition-transform duration-300">
                    <UsersIcon className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-pink-600 mb-3 sm:mb-4 text-center">球友列表</h3>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed text-center">
                    快来看看都有谁在网站留下足迹
                  </p>
                </div>
              </div>
          )}


        </div>
      </div>
  );

}
