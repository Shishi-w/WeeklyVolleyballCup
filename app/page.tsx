'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/browser';
import Link from 'next/link';
import Image from 'next/image';
import { VolleyballIcon, CalendarIcon, UsersIcon, FlowerIcon, LoadingIcon} from '@/components/Icons';

type Profile = {
  id: string;
  username: string;
  created_at: string;
};



type Stats = {
  totalMatches: number;
  ongoingMatches: number;
  totalPlayers: number;
  upcomingMatchName?: string;
  upcomingMatchCountdown?: string;
};

export default function Home() {
  const [showUsers, setShowUsers] = useState(false);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const supabase = createClient();

  useEffect(() => {
    checkUser();
    fetchStats();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      mouseRef.current = { x, y };
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
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

  const fetchStats = async () => {
    try {
      const { data: matches } = await supabase
        .from('matches_with_status')
        .select('id, name, start_date, end_date, status');

      if (matches) {
        const totalMatches = matches.length;
        const ongoingMatches = matches.filter(m => m.status === 'ongoing').length;
        const upcomingMatch = matches.find(m => m.status === 'upcoming');
        
        let countdown;
        if (upcomingMatch) {
          const now = new Date();
          const matchDate = new Date(upcomingMatch.start_date);
          const diff = matchDate.getTime() - now.getTime();
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          countdown = `${days}天 ${hours}小时`;
        }

        const { count: playerCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalMatches,
          ongoingMatches,
          totalPlayers: playerCount || 0,
          ...(upcomingMatch && countdown && {
            upcomingMatchName: upcomingMatch.name,
            upcomingMatchCountdown: countdown
          })
        });
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
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
      setShowUsers(true);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      alert('获取用户列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '你又熬夜了吗';
    if (hour < 9) return '吃早餐了吗';
    if (hour < 12) return '真是元气满满的一天';
    if (hour < 14) return '中午吃啥好吃的了';
    if (hour < 18) return '上课不许开小差';
    if (hour < 22) return '晚上也要吃好的';
    return '你又熬夜了吗';
  };
// ... existing code ...

  return (
      <div
          ref={containerRef}
          className="min-h-screen relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fbcfe8 100%)'
          }}
      >
        {/* 背景层 - 四张水彩插画人物 */}
        <div className="absolute inset-0 overflow-hidden">
          {/* 左上人物 - 举手击球 */}
          <div
              className="absolute -top-10 -left-10 opacity-15 sm:opacity-20 md:opacity-25"
              style={{
                width: '70vw',
                maxWidth: '500px',

                transition: 'transform 0.3s ease-out',
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

          {/* 右上人物 - 网前垫球 */}
          <div
              className="absolute -top-20 -right-10 opacity-15 sm:opacity-20 md:opacity-25"
              style={{
                width: '75vw',
                maxWidth: '600px',

                transition: 'transform 0.3s ease-out',
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

          {/* 左下人物 - 第三张 */}
          <div
              className="absolute -bottom-28 -left-10 opacity-15 sm:opacity-20 md:opacity-25"
              style={{
                width: '65vw',
                maxWidth: '450px',

                transition: 'transform 0.3s ease-out',
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

          {/* 右下人物 - 第四张 */}
          <div
              className="absolute -bottom-28 -right-10 opacity-15 sm:opacity-20 md:opacity-25"
              style={{
                width: '70vw',
                maxWidth: '500px',

                transition: 'transform 0.3s ease-out',
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

          {/* 中间的装饰元素 - 简约风格 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* 中央光晕 */}
            <div
                className="w-[60vw] h-[60vh] rounded-full opacity-20"
                style={{
                  background: 'radial-gradient(circle, rgba(251,207,232,0.5) 0%, transparent 70%)',
                  transform: `translate(${mousePosition.x * -0.02}px, ${mousePosition.y * -0.02}px)`,
                  transition: 'transform 0.5s ease-out'
                }}
            />
          </div>

          {/* 装饰性线条 - 增加动感 */}
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
                style={{
                  transform: `translate(${mousePosition.x * -0.01}px)`,
                  transition: 'transform 0.8s ease-out'
                }}
            />
            <path
                d="M 0,500 Q 400,700 800,500 T 1600,500"
                fill="none"
                stroke="url(#lineGradient1)"
                strokeWidth="2"
                style={{
                  transform: `translate(${mousePosition.x * 0.01}px)`,
                  transition: 'transform 0.8s ease-out'
                }}
            />
          </svg>
        </div>

        {/* 网格背景 */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>

        {/* 内容区域 */}
        <div className="container mx-auto px-4 py-12 relative z-10">

          {/* Hero Section - 个性化问候 */}
          <div className="text-center mb-16">
            <div className="inline-block mb-8 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-300 via-amber-200 to-pink-300 rounded-full blur-2xl opacity-50 animate-pulse"></div>
              <div
                  className="relative z-10 transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                  style={{
                    filter: 'drop-shadow(0 0 20px rgba(251,191,162,0.6))'
                  }}
              >
                <VolleyballIcon className="w-28 h-28 sm:w-36 sm:h-36 mx-auto animate-float" />
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-amber-500 to-pink-500 mb-6 leading-tight drop-shadow-lg">
              Weekly Volleyball Cup
            </h1>

            <div className="flex items-center justify-center gap-3 mb-8">
            <span className="text-2xl sm:text-3xl from-pink-300 font-light">
              {currentUser ? `${getGreeting()}，${currentUser.username || '球友'} !` : getGreeting()}
            </span>

            </div>

            {/* 主按钮组 */}
            {!showUsers ? (
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
                  <Link
                      href="/timeline"
                      className="group relative overflow-hidden bg-gradient-to-r from-pink-400 to-amber-400 text-white px-10 py-4 rounded-2xl text-lg font-bold hover:shadow-2xl hover:scale-105 transition-all duration-300 w-full sm:w-auto border border-white/50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative z-10 flex items-center justify-center gap-2">
                  <CalendarIcon className="w-6 h-6" />
                  赛事时间轴
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
                  </Link>

                  <button
                      onClick={fetchUsers}
                      disabled={loading}
                      className="group relative overflow-hidden bg-white/95 text-pink-600 px-10 py-4 rounded-2xl text-lg font-bold hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 w-full sm:w-auto border-2 border-pink-200"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-50 to-amber-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative z-10 flex items-center justify-center gap-2">
                  <UsersIcon className="w-6 h-6" />
                      {loading ? (
                          <>
                            <LoadingIcon className="w-5 h-5 animate-spin" />
                            加载中...
                          </>
                      ) : (
                          <>查看球友列表</>
                      )}
                </span>
                  </button>
                </div>
            ) : (
                <div className="flex gap-4 justify-center px-4">
                  <button
                      onClick={() => setShowUsers(false)}
                      className="bg-white/95 text-gray-700 px-10 py-4 rounded-2xl text-lg font-bold hover:bg-pink-50 hover:shadow-xl transition-all duration-300 border-2 border-pink-100"
                  >
                    返回首页
                  </button>
                </div>
            )}
          </div>

          {/* User List Section - 改进版 */}
          {showUsers && (
              <div className="max-w-5xl mx-auto">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-300 to-amber-200 rounded-3xl blur-xl opacity-30"></div>
                  <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50">
                    <div className="text-center mb-8">
                      <div className="inline-block mb-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-pink-300 to-amber-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
                          <UsersIcon className="w-20 h-20 mx-auto relative z-10" />
                        </div>
                      </div>
                      <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-amber-500 mb-3">
                        球友列表
                      </h2>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="text-gray-600 text-sm">
                          {users.length} 位球友已加入
                        </p>
                      </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-16">
                          <LoadingIcon className="h-16 w-16 mx-auto text-pink-500 animate-spin" />
                          <p className="text-gray-600 mt-6">加载中...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-16">
                          <FlowerIcon className="w-20 h-20 mx-auto mb-6 text-pink-400" />
                          <p className="text-gray-600 text-lg">暂无球友，快来成为第一个吧！</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                            <tr className="border-b-2 border-pink-100">
                              <th className="text-left py-4 px-4 text-pink-600 font-bold text-sm">#</th>
                              <th className="text-left py-4 px-4 text-pink-600 font-bold text-sm">球友</th>
                              <th className="text-right py-4 px-4 text-pink-600 font-bold text-sm">加入时间</th>
                            </tr>
                            </thead>
                            <tbody>
                            {users.map((user, index) => (
                                <tr key={user.id} className="border-b border-pink-50 hover:bg-pink-50/30 transition-colors group">
                                  <td className="py-4 px-4 text-gray-600">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-amber-400 text-white font-bold text-sm">
                                {index + 1}
                              </span>
                                  </td>
                                  <td className="py-4 px-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-amber-400 flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                        {(user.username || 'U').charAt(0).toUpperCase()}
                                      </div>
                                      <span className="text-gray-700 font-medium">
                                  {user.username || '未设置用户名'}
                                </span>
                                    </div>
                                  </td>
                                  <td className="text-right py-4 px-4 text-gray-600 text-sm whitespace-nowrap">
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
              </div>
          )}
        </div>
      </div>
  );
}
