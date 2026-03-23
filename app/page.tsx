'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';
import Link from 'next/link';

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
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-16">
          {/* Hero Section */}
          <div className="text-center mb-8 sm:mb-16">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-blue-900 mb-3 sm:mb-6 leading-tight">
              Weekly Volleyball Cup
            </h1>
            <p className="text-lg sm:text-2xl text-gray-700 mb-6 sm:mb-8 px-2">
              专业的排球赛事管理平台
            </p>

            {!showUsers ? (
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
                  <Link
                      href="/timeline"
                      className="bg-blue-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-base sm:text-lg font-semibold hover:bg-blue-700 transition-colors shadow-md w-full sm:w-auto"
                  >
                    赛事时间轴
                  </Link>
                  <button
                      onClick={fetchUsers}
                      disabled={loading}
                      className="bg-green-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-base sm:text-lg font-semibold hover:bg-green-700 transition-colors shadow-md disabled:opacity-50 w-full sm:w-auto"
                  >
                    {loading ? '加载中...' : '查看用户列表'}
                  </button>
                </div>
            ) : (
                <div className="flex gap-3 sm:gap-4 justify-center px-4">
                  <button
                      onClick={() => setShowUsers(false)}
                      className="bg-gray-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-base sm:text-lg font-semibold hover:bg-gray-700 transition-colors shadow-md w-full sm:w-auto"
                  >
                    返回首页
                  </button>
                </div>
            )}
          </div>

          {/* User List Section */}
          {showUsers && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8">
                  <h2 className="text-xl sm:text-3xl font-bold text-blue-900 mb-4 sm:mb-6 text-center">
                    用户列表
                  </h2>

                  {loading ? (
                      <div className="text-center py-8 sm:py-12">
                        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-600 mt-3 sm:mt-4 text-sm sm:text-base">加载中...</p>
                      </div>
                  ) : users.length === 0 ? (
                      <div className="text-center py-8 sm:py-12">
                        <p className="text-gray-600 text-sm sm:text-base">暂无用户</p>
                      </div>
                  ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                          <tr className="border-b-2 border-gray-200">
                            <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-blue-900 font-semibold text-xs sm:text-sm">#</th>
                            <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-blue-900 font-semibold text-xs sm:text-sm">用户名</th>
                            <th className="text-right py-2 sm:py-3 px-2 sm:px-4 pr-12 sm:pr-16 text-blue-900 font-semibold text-xs sm:text-sm">注册时间</th>
                          </tr>
                          </thead>
                          <tbody>
                          {users.map((user, index) => (
                              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-700 text-xs sm:text-sm">{index + 1}</td>
                                <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-700 text-xs sm:text-sm break-all">
                                  {user.username || '未设置用户名'}
                                </td>

                                <td className="text-right py-2 sm:py-3 px-2 sm:px-4 pr-8 sm:pr-12 text-gray-700 text-xs sm:text-sm whitespace-nowrap">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mt-8 sm:mt-12 md:mt-20">
                <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📅</div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-900 mb-2 sm:mb-3">赛事时间轴</h3>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                    查看历史比赛和最近一周的比赛，快速了解赛事进程
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🏐</div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-900 mb-2 sm:mb-3">赛事详情</h3>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                    查看本周主题和参赛队伍信息，支持实时协作编辑
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">👥</div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-900 mb-2 sm:mb-3">用户列表</h3>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                    查看网站注册的用户名单
                  </p>
                </div>
              </div>
          )}


        </div>
      </div>
  );

}
