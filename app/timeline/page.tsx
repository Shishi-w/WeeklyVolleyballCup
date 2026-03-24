'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';
import Link from 'next/link';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { CalendarIcon, LoadingIcon } from '@/components/Icons';

type Match = {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'ongoing' | 'completed';
};

export default function TimelinePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filter, setFilter] = useState<'all' | 'recent' | 'history'>('all');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchMatches();
  }, [filter]);

  const fetchMatches = async () => {
    try {
      let query = supabase
        .from('matches')
        .select('*')
        .order('start_date', { ascending: false });

      if (filter === 'recent') {
        // 最近一周：开始时间 >= 7 天前 且 结束时间 <= 7 天后
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
        
        query = query
          .gte('start_date', sevenDaysAgo.toISOString())
          .lte('end_date', sevenDaysLater.toISOString());
          
      } else if (filter === 'history') {
        // 历史比赛：只显示已结束的赛事
        query = query.eq('status', 'completed');
      }

      const { data, error } = await query;

      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      console.error('获取赛事失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-teal-100 text-teal-700';
      case 'ongoing':
        return 'bg-cyan-100 text-cyan-700';
      case 'completed':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '即将开始';
      case 'ongoing':
        return '进行中';
      case 'completed':
        return '已结束';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50 relative overflow-hidden">
      {/* 装饰背景 */}
      <div className="fixed top-20 left-10 w-32 h-32 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
      <div className="fixed bottom-20 right-10 w-32 h-32 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '1.5s' }}></div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-6">
            <CalendarIcon className="w-20 h-20 sm:w-24 sm:h-24 mx-auto animate-float" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 mb-4">
            赛事时间轴
          </h1>
          <p className="text-gray-600 mb-6">
            查看历史比赛和最近一周的赛事
          </p>

          {/* Filter Buttons */}
          <div className="flex gap-2 justify-center flex-wrap mb-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-soft hover:shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-cyan-50 border-2 border-cyan-100'
              }`}
            >
              全部赛事
            </button>
            <button
              onClick={() => setFilter('recent')}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                filter === 'recent'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-soft hover:shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-cyan-50 border-2 border-cyan-100'
              }`}
            >
              最近一周
            </button>
            <button
              onClick={() => setFilter('history')}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                filter === 'history'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-soft hover:shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-cyan-50 border-2 border-cyan-100'
              }`}
            >
              历史比赛
            </button>
          </div>

          {/* Back to Home */}
          <Link href="/" className="text-cyan-600 hover:text-cyan-700 hover:underline inline-block font-medium">
            ← 返回首页
          </Link>
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="text-center py-12">
            <LoadingIcon className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-cyan-500" />
            <p className="text-gray-600 mt-4">加载中...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">暂无赛事</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {matches.map((match, index) => (
              <div key={match.id} className="relative pl-8 pb-8 border-l-4 border-cyan-200">
                {/* Timeline dot */}
                <div className="absolute left-[-10px] top-0 w-5 h-5 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 border-4 border-white shadow"></div>

                {/* Match Card */}
                <Link href={`/match/${match.id}`}>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft p-6 hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer border-2 border-cyan-100">
                    <div className="flex justify-between items-start mb-4 flex-col sm:flex-row gap-2">
                      <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-700 to-teal-700">{match.name}</h3>
                      <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(match.status)} whitespace-nowrap`}>
                        {getStatusText(match.status)}
                      </span>
                    </div>

                    {match.description && (
                      <p className="text-gray-600 mb-4 leading-relaxed">{match.description}</p>
                    )}

                    <div className="flex items-center text-gray-500 text-sm flex-wrap gap-2">
                      <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        {format(new Date(match.start_date), 'yyyy 年 MM 月 dd 日 HH:mm', { locale: zhCN })}
                        {' - '}
                        {format(new Date(match.end_date), 'yyyy 年 MM 月 dd 日 HH:mm', { locale: zhCN })}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
