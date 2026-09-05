'use client';

import { useState } from 'react';
import Link from 'next/link';
import { VolleyballIcon, UsersIcon, CalendarIcon } from '@/components/Icons';
import AccountSettings from './AccountSettings';

type Team = {
  id: string;
  team_name: string;
  description?: string | null;
  captain_name: string;
  captain_id?: string | null;
  status: string;
  created_at: string;
  match_name?: string | null;
  match_id?: string;
  position?: string;
  joined_at: string;
};

type MatchResult = {
  id: string;
  match_name: string;
  match_date: string;
  team_name: string;
  rank: number;
  points: number;
  is_winner: boolean;
};

type Achievement = {
  id: string;
  match_name: string;
  team_name: string;
  achievement_type: string;
  title: string;
  description: string;
  awarded_at: string;
};

export default function MyTeamsClient({
  user,
  initialTeams,
  initialMatchResults,
  initialAchievements,
}: {
  user: { email: string; username: string | null };
  initialTeams: Team[];
  initialMatchResults: MatchResult[];
  initialAchievements: Achievement[];
}) {
  const teams = initialTeams;
  const matchResults = initialMatchResults;
  const achievements = initialAchievements;
  const [activeTab, setActiveTab] = useState<'teams' | 'matches' | 'achievements' | 'account'>('teams');

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'winner': return '🏆';
      case 'mvp': return '⭐';
      case 'best_spiker': return '💥';
      case 'best_blocker': return '🛡️';
      case 'best_server': return '🎯';
      case 'best_defender': return '🤾';
      case 'participation': return '🎖️';
      default: return '🏅';
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 2: return 'text-gray-600 bg-gray-50 border-gray-200';
      case 3: return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/40 rounded-full blur-xl"></div>
      </div>

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
              <VolleyballIcon className="w-10 h-10 text-indigo-600" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            个人中心
          </h1>
          <p className="text-xl text-gray-600">
            管理我的账号，查看我的队伍、比赛记录和荣誉成就
          </p>
        </div>

        {/* 标签页导航 */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-white/50">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('teams')}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === 'teams'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <UsersIcon className="w-4 h-4 inline mr-2" />
                我的队伍 ({teams.length})
              </button>
              <button
                onClick={() => setActiveTab('matches')}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === 'matches'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <CalendarIcon className="w-4 h-4 inline mr-2" />
                比赛记录 ({matchResults.length})
              </button>
              <button
                onClick={() => setActiveTab('achievements')}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === 'achievements'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >

                荣誉成就 ({achievements.length})
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === 'account'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                账号设置
              </button>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="max-w-6xl mx-auto">
          {/* 我的队伍 */}
          {activeTab === 'teams' && (
            <div>
              {teams.length === 0 ? (
                <div className="text-center py-12">
                  <UsersIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">暂未加入任何队伍</h3>
                  <p className="text-gray-500 mb-6">快去赛事详情页加入或创建队伍吧！</p>
                  <Link
                    href="/timeline"
                    className="inline-flex items-center gap-3 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-medium shadow-lg hover:shadow-xl hover:bg-indigo-700 transition-all duration-300"
                  >
                    <CalendarIcon className="w-5 h-5" />
                    浏览赛事
                  </Link>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-white/50"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {team.team_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {team.team_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {team.position || '队员'}
                          </p>
                        </div>
                      </div>

                      {team.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {team.description}
                        </p>
                      )}

                      <div className="space-y-2 text-sm text-gray-600">
                        <p>队长: {team.captain_name}</p>
                        <p>加入时间: {new Date(team.joined_at).toLocaleDateString('zh-CN')}</p>
                        {team.match_name && (
                          <p>所属赛事: {team.match_name}</p>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <Link
                          href={`/match/${team.match_id}`}
                          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                        >
                          查看赛事详情
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 比赛记录 */}
          {activeTab === 'matches' && (
            <div>
              {matchResults.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">暂无比赛记录</h3>
                  <p className="text-gray-500">参加比赛后，这里会显示你的比赛结果</p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  {matchResults.map((result) => (
                    <div
                      key={result.id}
                      className={`rounded-2xl p-6 shadow-lg border-2 transition-all duration-300 ${getRankColor(result.rank)}`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">
                            {result.rank === 1 ? '🥇' : result.rank === 2 ? '🥈' : result.rank === 3 ? '🥉' : '🏅'}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {result.match_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {result.team_name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            第{result.rank}名
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600">
                        <p>比赛日期: {new Date(result.match_date).toLocaleDateString('zh-CN')}</p>
                        {result.is_winner && (
                          <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            🏆 冠军队伍
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 荣誉成就 */}
          {activeTab === 'achievements' && (
            <div>
              {achievements.length === 0 ? (
                <div className="text-center py-12">

                  <h3 className="text-lg font-medium text-gray-900 mb-2">暂无荣誉成就</h3>
                  <p className="text-gray-500">在比赛中取得好成绩，这里会显示你的荣誉</p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-white/50"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="text-3xl">
                          {getAchievementIcon(achievement.achievement_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {achievement.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {achievement.match_name}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mb-4">
                        {achievement.description}
                      </p>

                      <div className="text-xs text-gray-500">
                        <p>{achievement.team_name}</p>
                        <p>获得时间: {new Date(achievement.awarded_at).toLocaleDateString('zh-CN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 账号设置 */}
          {activeTab === 'account' && <AccountSettings user={user} />}
        </div>
      </div>
    </div>
  );
}
