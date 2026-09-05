'use client';

import { useState, useEffect, useRef } from 'react';
import type { SessionUser } from '@/lib/auth';
import type { Announcement } from '@/lib/types';
import Link from 'next/link';
import { VolleyballIcon, CalendarIcon, UsersIcon } from '@/components/Icons';
import AnnouncementBoard from '@/components/AnnouncementBoard';

export default function HomeClient({
  currentUser,
  initialAnnouncements,
}: {
  currentUser: SessionUser | null;
  initialAnnouncements: Announcement[];
}) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const isLoggedIn = !!currentUser;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '好球好球';
    if (hour < 9) return '今天打球了吗';
    if (hour < 12) return '真是元气满满的一天';
    if (hour < 14) return '真是元气满满的一天';
    if (hour < 18) return '上课不许开小差';
    if (hour < 22) return '晚上好';
    return '好球好球';
  };

  const mx = mousePosition.x;
  const my = mousePosition.y;

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
        <div
          className="absolute top-[0%] left-[-5%] opacity-12 sm:opacity-15 md:opacity-20"
          style={{
            width: '55vw',
            maxWidth: '400px',
            transform: `translate(${mx * -0.03}px, ${my * -0.02}px)`,
            transition: 'transform 0.3s ease-out',
            filter: 'drop-shadow(0 0 30px rgba(253,186,116,0.3))'
          }}
        >
          <img
            src="/volleyball-player-4.png"
            alt="Volleyball Player 4"
            className="w-full h-auto"
            style={{ objectFit: 'contain' }}
          />
        </div>

        <div
          className="absolute top-[20%] right-[5%] opacity-12 sm:opacity-15 md:opacity-20"
          style={{
            width: '55vw',
            maxWidth: '380px',
            transform: `translate(${mx * 0.03}px, ${my * -0.02}px)`,
            transition: 'transform 0.3s ease-out',
            filter: 'drop-shadow(0 0 30px rgba(253,186,116,0.3))'
          }}
        >
          <img
            src="/volleyball-player-2.png"
            alt="Volleyball Player 2"
            className="w-full h-auto"
            style={{ objectFit: 'contain' }}
          />
        </div>

        <div
          className="absolute top-[50%] left-[-5%] opacity-12 sm:opacity-15 md:opacity-20"
          style={{
            width: '55vw',
            maxWidth: '360px',
            transform: `translate(${mx * -0.02}px, ${my * 0.03}px)`,
            transition: 'transform 0.3s ease-out',
            filter: 'drop-shadow(0 0 30px rgba(253,186,116,0.3))'
          }}
        >
          <img
            src="/volleyball-player-3.png"
            alt="Volleyball Player 3"
            className="w-full h-auto"
            style={{ objectFit: 'contain' }}
          />
        </div>

        <div
          className="absolute top-[65%] right-[-5%] opacity-12 sm:opacity-15 md:opacity-20"
          style={{
            width: '55vw',
            maxWidth: '400px',
            transform: `translate(${mx * 0.02}px, ${my * 0.03}px)`,
            transition: 'transform 0.3s ease-out',
            filter: 'drop-shadow(0 0 30px rgba(253,186,116,0.3))'
          }}
        >
          <img
            src="/volleyball-player-1.png"
            alt="Volleyball Player 1"
            className="w-full h-auto"
            style={{ objectFit: 'contain' }}
          />
        </div>

        {/* 中间的装饰元素 - 简约风格 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-[60vw] h-[60vh] rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, rgba(251,207,232,0.5) 0%, transparent 70%)',
              transform: `translate(${mx * -0.02}px, ${my * -0.02}px)`,
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
            style={{ transform: `translate(${mx * -0.01}px)`, transition: 'transform 0.8s ease-out' }}
          />
          <path
            d="M 0,500 Q 400,700 800,500 T 1600,500"
            fill="none"
            stroke="url(#lineGradient1)"
            strokeWidth="2"
            style={{ transform: `translate(${mx * 0.01}px)`, transition: 'transform 0.8s ease-out' }}
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
              style={{ filter: 'drop-shadow(0 0 20px rgba(251,191,162,0.6))' }}
            >
              <VolleyballIcon className="w-28 h-28 sm:w-36 sm:h-36 mx-auto animate-float" />
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-amber-500 to-pink-400 mb-6 leading-tight drop-shadow-lg">
            Weekly Volleyball Cup
          </h1>

          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="text-2xl sm:text-3xl from-pink-300 font-light">
              {currentUser ? `${getGreeting()}，${currentUser.username || '球友'} !` : getGreeting()}
            </span>
          </div>

          {/* 主按钮组 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
            <Link
              href="/timeline"
              className="group relative overflow-hidden bg-pink-400 text-white px-10 py-4 rounded-2xl text-lg font-bold hover:shadow-2xl hover:scale-105 transition-all duration-300 w-full sm:w-auto border border-white/50"
            >
              <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center justify-center gap-2">
                <CalendarIcon className="w-6 h-6" />
                赛事时间轴
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </Link>

            <Link
              href="/users"
              className="group relative overflow-hidden bg-white/95 text-pink-500 px-10 py-4 rounded-2xl text-lg font-bold hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 w-full sm:w-auto border-2 border-pink-200"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-50 to-amber-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center justify-center gap-2">
                <UsersIcon className="w-6 h-6" />
                查看球友列表
              </span>
            </Link>

            {currentUser && (
              <Link
                href="/my-teams"
                className="group relative overflow-hidden bg-indigo-600 text-white px-10 py-4 rounded-2xl text-lg font-bold hover:shadow-2xl hover:scale-105 transition-all duration-300 w-full sm:w-auto border border-white/50"
              >
                <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <VolleyballIcon className="w-6 h-6" />
                  个人中心
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </Link>
            )}
          </div>

          {/* 赛事公告栏 */}
          <div className="mt-8 sm:mt-12">
            <AnnouncementBoard isLoggedIn={isLoggedIn} initialAnnouncements={initialAnnouncements} />
          </div>
        </div>
      </div>
    </div>
  );
}
