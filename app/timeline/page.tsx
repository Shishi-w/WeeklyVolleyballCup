'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';
import Link from 'next/link';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

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
        return 'bg-green-100 text-green-800';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-4">
            赛事时间轴
          </h1>
          <p className="text-gray-600 mb-6">
            查看历史比赛和最近一周的赛事
          </p>

          {/* Filter Buttons */}
          <div className="flex gap-2 justify-center flex-wrap mb-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              全部赛事
            </button>
            <button
              onClick={() => setFilter('recent')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                filter === 'recent'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              最近一周
            </button>
            <button
              onClick={() => setFilter('history')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                filter === 'history'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              历史比赛
            </button>
          </div>

          {/* Back to Home */}
          <Link href="/" className="text-blue-600 hover:underline inline-block">
            ← 返回首页
          </Link>
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">加载中...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">暂无赛事</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {matches.map((match, index) => (
              <div key={match.id} className="relative pl-8 pb-8 border-l-4 border-blue-200">
                {/* Timeline dot */}
                <div className="absolute left-[-10px] top-0 w-5 h-5 rounded-full bg-blue-600 border-4 border-white shadow"></div>

                {/* Match Card */}
                <Link href={`/match/${match.id}`}>
                  <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-2xl font-bold text-blue-900">{match.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(match.status)}`}>
                        {getStatusText(match.status)}
                      </span>
                    </div>

                    {match.description && (
                      <p className="text-gray-600 mb-4">{match.description}</p>
                    )}

                    <div className="flex items-center text-gray-500 text-sm">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
