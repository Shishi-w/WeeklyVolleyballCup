'use client';

import { useState, useEffect } from 'react';
import { getMatchById, updateMatch, deleteMatch } from '@/lib/actions/matches';
import { listMatchTeams, createTeam, updateTeam, deleteTeam } from '@/lib/actions/teams';
import {
  getLatestTheme,
  saveTheme,
  getRule,
  saveRule,
  getResult,
  saveResult,
} from '@/lib/actions/matchContent';
import {
  listRecords,
  createRecord,
  deleteRecord,
  updateCaption,
  addComment,
} from '@/lib/actions/records';
import {
  listTeamResultsByMatch,
  getExistingTeamResults,
  upsertTeamResults,
} from '@/lib/actions/results';
import {
  listMatchAchievements,
  upsertAchievement,
  deleteAchievement,
} from '@/lib/actions/achievements';
import { listProfileSelect } from '@/lib/actions/profiles';
import { uploadImage, generateThumb } from '@/lib/actions/upload';
import Link from 'next/link';
import Image from 'next/image';
import MatchFormModal from '@/components/MatchFormModal';
import { getOptimizedImageUrl, getBlurPlaceholder } from '@/lib/imageUtils';
import { VolleyballIcon, LoadingIcon, FlowerIcon } from '@/components/Icons';
import type { SessionUser } from '@/lib/auth';
import type { Team, TeamPlayer } from '@/lib/types';

type Match = {
    id: string;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    status: string;
};

type Theme = {
    id: string;
    content: string;
    edited_by_username: string | null;
    updated_at: string;
};

type Rule = {
    id: string;
    content: string;
    edited_by_username: string | null;
    updated_at: string;
};

type Result = {
    id: string;
    content: string;
    edited_by_username: string | null;
    updated_at: string;
};

type Record = {
    id: string;
    image_url: string;
    thumb_url?: string | null;
    caption: string;
    edited_by_username: string | null;
    created_at: string;
    comments?: string[];
};

type MatchDetailData = {
    match: Match;
    theme: Theme | null;
    rule: Rule | null;
    result: Result | null;
    records: any[];
    teams: Team[];
    matchResults: any[];
    achievements: any[];
};/** 以 limit 并发跑 items（顺序写入 results），避免一次并发过多请求 */
async function mapWithConcurrency<T, R>(
    items: T[],
    limit: number,
    fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let next = 0;
    const workerCount = Math.max(1, Math.min(limit, items.length));
    await Promise.all(
        Array.from({ length: workerCount }, async () => {
            while (next < items.length) {
                const i = next++;
                const item = items[i];
                if (item === undefined) continue;
                results[i] = await fn(item, i);
            }
        })
    );
    return results;
}

export default function MatchDetailClient({
    matchId,
    currentUser,
    initialData,
}: {
    matchId: string;
    currentUser: SessionUser | null;
    initialData: MatchDetailData;
}) {
    const {
        theme: initialTheme,
        rule: initialRule,
        result: initialResult,
        records: initialRecords,
        teams: initialTeams,
        matchResults: initialMatchResults,
        achievements: initialAchievements,
    } = initialData;

    const [match, setMatch] = useState<Match | null>(initialData.match);
    const [theme, setTheme] = useState<Theme | null>(initialTheme);
    const [rule, setRule] = useState<Rule | null>(initialRule);
    const [result, setResult] = useState<Result | null>(initialResult);
    const [teams, setTeams] = useState<Team[]>(initialTeams);
    const [loading, setLoading] = useState(false);
    const [editingTheme, setEditingTheme] = useState(false);
    const [editingRule, setEditingRule] = useState(false);
    const [editingResult, setEditingResult] = useState(false);
    const [themeContent, setThemeContent] = useState(initialTheme?.content ?? '');
    const [ruleContent, setRuleContent] = useState(initialRule?.content ?? '');
    const [resultContent, setResultContent] = useState(initialResult?.content ?? '');
    const [showAddTeam, setShowAddTeam] = useState(false);
    const [showEditMatch, setShowEditMatch] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [newRecordCaption, setNewRecordCaption] = useState('');
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [editingRecord, setEditingRecord] = useState<Record | null>(null);
    const [viewingComments, setViewingComments] = useState<number | null>(null);
    const [newComment, setNewComment] = useState('');
    const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const [records, setRecords] = useState<any[]>(initialRecords);
    const [showRecordResults, setShowRecordResults] = useState(false);
    const [matchResults, setMatchResults] = useState<any[]>(initialMatchResults);
    const [userAchievements, setUserAchievements] = useState<any[]>(initialAchievements);

    const isLoggedIn = !!currentUser;
    const isAdmin = currentUser?.role === 'admin';

    const fetchData = async () => {
        try {
            const matchData = await getMatchById(matchId);
            if (!matchData) throw new Error('赛事不存在');
            setMatch(matchData);

            const themeData = await getLatestTheme(matchId);
            setTheme(themeData);
            if (themeData) setThemeContent(themeData.content);

            const ruleData = await getRule(matchId);
            setRule(ruleData);
            if (ruleData) setRuleContent(ruleData.content);

            const resultData = await getResult(matchId);
            setResult(resultData);
            if (resultData) setResultContent(resultData.content);

            const recordsData = await listRecords(matchId);
            setRecords(recordsData || []);

            const teamsData = await listMatchTeams(matchId);
            setTeams(teamsData || []);

            const teamResultsData = await listTeamResultsByMatch(matchId);
            setMatchResults(teamResultsData || []);

            const achievementsData = await listMatchAchievements(matchId);
            setUserAchievements(achievementsData || []);
        } catch (error) {
            console.error('获取数据失败:', error);
        } finally {
            setLoading(false);
        }
    };



    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isLoggedIn) {
            handleRedirectToLogin();
            return;
        }

        const files = e.target.files;
        if (!files || files.length === 0) return;

        const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

        if (validFiles.length === 0) {
            alert('请选择有效的图片文件');
            return;
        }

        setUploadingImage(true);
        setUploadProgress({ current: 0, total: validFiles.length });

        try {
            let successCount = 0;

            // 并发上传（上限 3）：每张 = 传原图 + 写记录，缩略图后台生成不阻塞
            await mapWithConcurrency(validFiles, 3, async (file) => {
                try {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('matchId', matchId);

                    const { url } = await uploadImage(formData);
                    await createRecord({
                        match_id: matchId,
                        image_url: url,
                        caption: newRecordCaption || '',
                    });

                    void generateThumb(url).catch((err) =>
                        console.error('后台生成缩略图失败（忽略，前端回退原图）:', err)
                    );

                    successCount++;
                } catch (error) {
                    console.error('上传图片失败:', error);
                } finally {
                    setUploadProgress((prev) =>
                        prev ? { ...prev, current: prev.current + 1 } : prev
                    );
                }
            });

            setNewRecordCaption('');
            setUploadProgress(null);
            fetchData();
            alert(`成功上传 ${successCount}/${validFiles.length} 张图片`);
        } catch (error) {
            console.error('批量上传图片失败:', error);
            alert('上传失败，请重试');
        } finally {
            setUploadingImage(false);
            setUploadProgress(null);
        }
    };

    const canEdit = isLoggedIn;

    const handleRedirectToLogin = () => {
        const currentPath = window.location.pathname;
        window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(currentPath)}`;
    };

    const handleSaveTheme = async () => {
        if (!isAdmin) {
            if (!isLoggedIn) {
                handleRedirectToLogin();
                return;
            }
            alert('无权限操作');
            return;
        }

        try {
            await saveTheme({ matchId, id: theme?.id ?? null, content: themeContent });

            setEditingTheme(false);
            fetchData();
            alert('主题已保存');
        } catch (error) {
            console.error('保存主题失败:', error);
            alert('保存失败，请重试');
        }
    };

    const handleSaveRule = async () => {
        if (!isAdmin) {
            if (!isLoggedIn) {
                handleRedirectToLogin();
                return;
            }
            alert('无权限操作');
            return;
        }

        try {
            await saveRule({ matchId, id: rule?.id ?? null, content: ruleContent });

            setEditingRule(false);
            fetchData();
            alert('规则已保存');
        } catch (error) {
            console.error('保存规则失败:', error);
            alert('保存失败，请重试');
        }
    };

    const handleSaveResult = async () => {
        if (!isAdmin) {
            if (!isLoggedIn) {
                handleRedirectToLogin();
                return;
            }
            alert('无权限操作');
            return;
        }

        try {
            await saveResult({ matchId, id: result?.id ?? null, content: resultContent });

            setEditingResult(false);
            fetchData();
            alert('结果已保存');
        } catch (error) {
            console.error('保存结果失败:', error);
            alert('保存失败，请重试');
        }
    };



    const handleSaveMatch = async (values: { name: string; description: string; start_date: string; end_date: string }) => {
        await updateMatch(matchId, values);
        setShowEditMatch(false);
        fetchData();
        alert('周赛已更新');
    };

    const handleDeleteMatch = async () => {
        if (!confirm('确定要删除这场周赛吗？\n\n将永久删除该周赛及全部关联数据（队伍、照片、赛果、荣誉、主题/规则/结果），此操作不可恢复！')) return;
        try {
            await deleteMatch(matchId);
            alert('周赛已删除');
            window.location.href = '/timeline';
        } catch (error) {
            console.error('删除周赛失败:', error);
            alert(error instanceof Error ? error.message : '删除失败，请重试');
        }
    };

    const handleDeleteRecord = async (recordId: string) => {
        if (!isLoggedIn) {
            handleRedirectToLogin();
            return;
        }

        if (!confirm('确定要删除这条记录吗？')) return;

        try {
            await deleteRecord(recordId);

            fetchData();
            alert('记录已删除');
        } catch (error) {
            console.error('删除记录失败:', error);
            alert('删除失败，请重试');
        }
    };

    const handleAddTeam = async (teamData: any) => {
        if (!canEdit) {
            if (!isLoggedIn) {
                handleRedirectToLogin();
                return;
            }
            alert('请先登录后再添加队伍');
            return;
        }

        try {
            await createTeam({
                team_name: teamData.team_name,
                captain_name: teamData.captain_name,
                players: teamData.players,
                match_id: matchId,
            });

            setShowAddTeam(false);
            fetchData();
            alert('队伍已添加');
        } catch (error) {
            console.error('添加队伍失败:', error);
            alert('添加失败，请重试');
        }
    };

    const handleDeleteTeam = async (teamId: string) => {

        if (!canEdit) {
            if (!isLoggedIn) {
                handleRedirectToLogin();
                return;
            }
            alert('请先登录后再删除队伍');
            return;
        }

    if (!confirm('确定要删除这支队伍吗？')) return;

    try {
        await deleteTeam(teamId);

        fetchData();
        alert('队伍已删除');
    } catch (error) {
        console.error('删除队伍失败:', error);
        alert('删除失败，请重试');
    }
     };

    const handleEditTeam = async (teamData: any) => {
        if (!editingTeam || !canEdit) {
            if (!isLoggedIn) {
                handleRedirectToLogin();
                return;
            }
            alert('请先登录后再编辑队伍');
            return;
        }

        try {
            await updateTeam(editingTeam.id, {
                team_name: teamData.team_name,
                captain_name: teamData.captain_name,
                players: teamData.players,
            });

            setEditingTeam(null);
            fetchData();
            alert('队伍信息已更新');
        } catch (error) {
            console.error('编辑队伍失败:', error);
            alert('更新失败，请重试');
        }
    };

    const handleEditRecordCaption = async (recordId: string, newCaption: string) => {
        if (!isLoggedIn) {
            handleRedirectToLogin();
            return;
        }

        try {
            await updateCaption(recordId, newCaption);

            setEditingRecord(null);
            fetchData();
            alert('说明文字已更新');
        } catch (error) {
            console.error('更新说明失败:', error);
            alert('更新失败，请重试');
        }
    };

    const handleAddComment = async (recordId: string) => {
        if (!isLoggedIn) {
            handleRedirectToLogin();
            return;
        }

        if (!newComment.trim()) {
            alert('请输入评论内容');
            return;
        }

        try {
            const commentWithAuthor = `${currentUser?.username || '匿名用户'}: ${newComment}`;

            await addComment(recordId, commentWithAuthor);

            setNewComment('');
            fetchData();
            alert('评论已添加');
        } catch (error) {
            console.error('添加评论失败:', error);
            alert('添加失败，请重试');
        }
    };




    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50">
                <div className="text-center">
                    <LoadingIcon className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-cyan-500" />
                    <p className="text-gray-600">加载中...</p>
                </div>
            </div>
        );
    }




    if (!match) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50">
                <div className="text-center">
                    <p className="text-gray-600">赛事不存在</p>
                    <Link href="/timeline" className="text-cyan-600 hover:text-cyan-700 hover:underline mt-4 block font-medium">
                        返回时间轴
                    </Link>
                </div>
            </div>
        );
    }




    const isCompleted = match.status === 'completed';

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50 relative overflow-hidden">
            {/* 装饰背景 */}
            <div className="fixed top-20 right-10 w-32 h-32 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
            <div className="fixed bottom-20 left-10 w-32 h-32 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '1.5s' }}></div>

            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 relative z-10">
                <Link href="/timeline" className="text-cyan-600 hover:text-cyan-700 hover:underline mb-4 sm:mb-6 inline-block text-sm sm:text-base font-medium">
                    ← 返回时间轴
                </Link>

                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft-lg p-4 sm:p-6 mb-6 sm:mb-8 border-2 border-cyan-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0">
                        <h1 className="text-2xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-700 to-teal-700 break-words w-full sm:w-auto">{match.name}</h1>
                        {isCompleted && (
                            <span className="bg-teal-100 text-teal-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap border-2 border-teal-200">
                                 已结束
                            </span>
                        )}
                    </div>
                    <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base line-clamp-2 leading-relaxed">{match.description}</p>
                    <div className="flex flex-col sm:flex-row gap-2 text-xs sm:text-sm text-gray-500">
                        <span>开始：{new Date(match.start_date).toLocaleString('zh-CN')}</span>
                        <span>结束：{new Date(match.end_date).toLocaleString('zh-CN')}</span>
                    </div>
                    {isAdmin && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                onClick={() => setShowEditMatch(true)}
                                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm rounded-xl hover:shadow-soft transition-all duration-300"
                            >
                                编辑周赛
                            </button>
                            <button
                                onClick={handleDeleteMatch}
                                className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm rounded-xl hover:shadow-soft transition-all duration-300"
                            >
                                删除周赛
                            </button>
                        </div>
                    )}
                </div>

                {/* Theme and Rules Section */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft-lg p-4 sm:p-6 mb-6 sm:mb-8 border-2 border-cyan-100">
                    <h2 className="text-lg sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-700 to-teal-700 mb-4">赛事信息与规则</h2>

                    {/* Theme */}
                    <div className="mb-6 pb-6 border-b border-cyan-100 last:border-0 last:pb-0 last:mb-0">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2">
                            <h3 className="text-base sm:text-xl font-semibold text-cyan-800">本周主题</h3>
                            {isAdmin && (
                                <button
                                    onClick={() => setEditingTheme(!editingTheme)}
                                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm sm:text-base rounded-xl hover:shadow-soft transition-all duration-300 w-full sm:w-auto"
                                >
                                    {editingTheme ? '取消编辑' : '编辑主题'}
                                </button>
                            )}
                        </div>

                        {editingTheme && isAdmin ? (
                            <div>
                                <textarea
                                    value={themeContent}
                                    onChange={(e) => setThemeContent(e.target.value)}
                                    className="w-full p-3 sm:p-4 border-2 border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-sm sm:text-base outline-none transition-all"
                                    rows={6}
                                    placeholder="请输入本周主题..."
                                />
                                <div className="mt-3 sm:mt-4 flex gap-2">
                                    <button
                                        onClick={handleSaveTheme}
                                        className="px-4 sm:px-6 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm sm:text-base rounded-xl hover:shadow-soft transition-all duration-300 flex-1 sm:flex-none"
                                    >
                                        保存
                                    </button>
                                    <button
                                        onClick={() => setEditingTheme(false)}
                                        className="px-4 sm:px-6 py-2 bg-gray-300 text-gray-700 text-sm sm:text-base rounded-xl hover:bg-gray-400 transition-colors flex-1 sm:flex-none"
                                    >
                                        取消
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="prose max-w-none">
                                <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{theme?.content || '暂无主题内容'}</p>
                                {theme && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        最后编辑：{theme.edited_by_username} · {new Date(theme.updated_at).toLocaleString('zh-CN')}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Rules */}
                    <div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2">
                            <h3 className="text-base sm:text-xl font-semibold text-cyan-800">赛事规则</h3>
                            {isAdmin && (
                                <button
                                    onClick={() => setEditingRule(!editingRule)}
                                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm sm:text-base rounded-xl hover:shadow-soft transition-all duration-300 w-full sm:w-auto"
                                >
                                    {editingRule ? '取消编辑' : '编辑规则'}
                                </button>
                            )}
                        </div>

                        {editingRule && isAdmin ? (
                            <div>
                                <textarea
                                    value={ruleContent}
                                    onChange={(e) => setRuleContent(e.target.value)}
                                    className="w-full p-3 sm:p-4 border-2 border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-sm sm:text-base outline-none transition-all"
                                    rows={8}
                                    placeholder="请输入赛事规则..."
                                />
                                <div className="mt-3 sm:mt-4 flex gap-2">
                                    <button
                                        onClick={handleSaveRule}
                                        className="px-4 sm:px-6 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm sm:text-base rounded-xl hover:shadow-soft transition-all duration-300 flex-1 sm:flex-none"
                                    >
                                        保存
                                    </button>
                                    <button
                                        onClick={() => setEditingRule(false)}
                                        className="px-4 sm:px-6 py-2 bg-gray-300 text-gray-700 text-sm sm:text-base rounded-xl hover:bg-gray-400 transition-colors flex-1 sm:flex-none"
                                    >
                                        取消
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="prose max-w-none">
                                <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{rule?.content || '暂无规则内容'}</p>
                                {rule && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        最后编辑：{rule.edited_by_username} · {new Date(rule.updated_at).toLocaleString('zh-CN')}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Teams Section */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft-lg p-4 sm:p-6 mb-6 sm:mb-8 border-2 border-cyan-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
                        <h2 className="text-lg sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-700 to-teal-700">参赛队伍</h2>
                        <div className="flex gap-2">
                            {isCompleted && isAdmin && (
                                <button
                                    onClick={() => setShowRecordResults(true)}
                                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm sm:text-base rounded-xl hover:shadow-soft transition-all duration-300 flex items-center gap-2"
                                >
                                    记录比赛结果
                                </button>
                            )}
                            {canEdit && (
                                <button
                                    onClick={() => setShowAddTeam(true)}
                                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm sm:text-base rounded-xl hover:shadow-soft transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    <span className="text-lg">+</span> 添加队伍
                                </button>
                            )}
                        </div>
                    </div>

                    {teams.length === 0 ? (
                        <p className="text-gray-600 text-center py-8 text-sm sm:text-base">暂无参赛队伍</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {teams.map((team) => (
                                <div key={team.id} className="border-2 border-cyan-100 rounded-xl p-3 sm:p-4 hover:shadow-soft hover:-translate-y-1 transition-all duration-300 relative bg-white/50">
                                    {canEdit && (
                                        <div className="absolute top-2 right-2 flex gap-1.5 sm:gap-2">
                                            <button
                                                onClick={() => {
                                                    console.log('点击编辑队伍:', team);
                                                    setEditingTeam(team);
                                                }}
                                                className="text-cyan-500 hover:text-cyan-700 text-lg sm:text-base font-medium p-1 bg-white rounded-full shadow"
                                                title="编辑队伍"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTeam(team.id)}
                                                className="text-red-500 hover:text-red-700 text-lg sm:text-base font-medium p-1 bg-white rounded-full shadow"
                                                title="删除队伍"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    )}
                                    <h3 className="text-lg sm:text-xl font-bold text-cyan-800 mb-2 sm:mb-3 pr-16 break-words">{team.team_name}</h3>
                                    <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                                        <p><span className="font-medium text-gray-600">队长：</span>{team.captain_name}</p>
                                        {team.players && team.players.length > 0 && (
                                            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-cyan-100">
                                                <p className="font-medium text-gray-600 mb-1.5 sm:mb-2 text-xs sm:text-sm">队员 ({team.players.length}):</p>
                                                <ul className="space-y-1">
                                                    {team.players.map((player, idx) => (
                                                        <li key={idx} className="text-gray-700 text-xs sm:text-sm truncate">
                                                            • {player.name}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {showAddTeam && (
                    <AddTeamModal
                        onClose={() => setShowAddTeam(false)}
                        onAdd={handleAddTeam}
                    />
                )}

                {editingTeam && canEdit && (
                    <EditTeamModal
                        team={editingTeam}
                        onClose={() => setEditingTeam(null)}
                        onEdit={handleEditTeam}
                    />
                )}
                {editingRecord && isLoggedIn && (
                    <EditRecordCaptionModal
                        record={editingRecord}
                        onClose={() => setEditingRecord(null)}
                        onEdit={handleEditRecordCaption}
                    />
                )}
                {showRecordResults && isAdmin && (
                    <RecordResultsModal
                        matchId={matchId}
                        teams={teams}
                        onClose={() => setShowRecordResults(false)}
                        onSave={fetchData}
                    />
                )}
                {showEditMatch && match && (
                    <MatchFormModal
                        title="编辑周赛"
                        initial={{ name: match.name, description: match.description || '', start_date: match.start_date, end_date: match.end_date }}
                        onClose={() => setShowEditMatch(false)}
                        onSave={handleSaveMatch}
                    />
                )}

                {/* Results and Records Section */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft-lg p-4 sm:p-6 mt-6 sm:mt-8 border-2 border-cyan-100">
                    <h2 className="text-lg sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-700 to-teal-700 mb-4 sm:mb-6">赛事结果与记录</h2>

                        {/* Match Results Display */}
                        {matchResults.length > 0 && (
                            <div className="mb-8 pb-8 border-b border-cyan-100">
                                <h3 className="text-base sm:text-xl font-semibold text-cyan-800 mb-4">🏆 队伍排名</h3>
                                <div className="space-y-3">
                                    {matchResults.map((result, index) => (
                                        <div
                                            key={result.id}
                                            className={`p-4 rounded-xl border-2 ${
                                                result.is_winner
                                                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300'
                                                    : 'bg-gray-50 border-gray-200'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                                                        index === 0 ? 'bg-yellow-500' :
                                                            index === 1 ? 'bg-gray-400' :
                                                                index === 2 ? 'bg-orange-600' :
                                                                    'bg-cyan-500'
                                                    }`}>
                                                        {result.rank}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800 text-lg">{result.teams?.team_name}</p>
                                                        {result.is_winner && (
                                                            <p className="text-sm text-yellow-600 font-medium">🎉 冠军队伍</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-2xl font-bold text-cyan-600">第{result.rank}名</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}


                    {/* User Achievements Display */}
                    {userAchievements.length > 0 && (
                        <div className="mb-8 pb-8 border-b border-cyan-100">
                            <h3 className="text-base sm:text-xl font-semibold text-cyan-800 mb-4">⭐ 个人荣誉</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {userAchievements.map((achievement) => (
                                    <div
                                        key={achievement.id}
                                        className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 hover:shadow-soft transition-all duration-300"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="font-bold text-gray-800 text-lg">{achievement.title}</p>
                                                <p className="text-sm text-gray-600">
                                                    👤 {achievement.user_name || '未知用户'}
                                                </p>
                                                {achievement.teams?.team_name && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        🏐 {achievement.teams.team_name}
                                                    </p>
                                                )}
                                            </div>
                                            <span className="text-2xl">
                                                {achievement.achievement_type === 'mvp' ? '🌟' :
                                                    achievement.achievement_type === 'best_player' ? '⭐' :
                                                        achievement.achievement_type === 'best_scorer' ? '🔥' :
                                                            '🎖️'}
                                            </span>
                                        </div>
                                        {achievement.description && (
                                            <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                                                {achievement.description}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}


                    {/* Results */}
                        <div className="mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-cyan-100 last:border-0 last:pb-0 last:mb-0">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2">
                                <h3 className="text-base sm:text-xl font-semibold text-cyan-800">赛事结果公示</h3>
                                {isAdmin && (
                                    <button
                                        onClick={() => setEditingResult(!editingResult)}
                                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm sm:text-base rounded-xl hover:shadow-soft transition-all duration-300 w-full sm:w-auto"
                                    >
                                        {editingResult ? '取消编辑' : '编辑结果'}
                                    </button>
                                )}
                            </div>


                        {editingResult && isAdmin ? (
                            <div>
                                <textarea
                                    value={resultContent}
                                    onChange={(e) => setResultContent(e.target.value)}
                                    className="w-full p-3 sm:p-4 border-2 border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-sm sm:text-base outline-none transition-all"
                                    rows={8}
                                    placeholder="请输入赛事结果..."
                                />
                                <div className="mt-3 sm:mt-4 flex gap-2">
                                    <button
                                        onClick={handleSaveResult}
                                        className="px-4 sm:px-6 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm sm:text-base rounded-xl hover:shadow-soft transition-all duration-300 flex-1 sm:flex-none"
                                    >
                                        保存
                                    </button>
                                    <button
                                        onClick={() => setEditingResult(false)}
                                        className="px-4 sm:px-6 py-2 bg-gray-300 text-gray-700 text-sm sm:text-base rounded-xl hover:bg-gray-400 transition-colors flex-1 sm:flex-none"
                                    >
                                        取消
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="prose max-w-none">
                                <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{result?.content || '暂无结果公示'}</p>
                                {result && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        最后编辑：{result.edited_by_username} · {new Date(result.updated_at).toLocaleString('zh-CN')}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Records */}
                    <div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2">
                            <h3 className="text-base sm:text-xl font-semibold text-cyan-800">赛事图文记录</h3>
                        </div>

                        

                        {isLoggedIn && (
                            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-cyan-50 rounded-xl border-2 border-cyan-100">
                                <div className="flex flex-col gap-3">
                                    {uploadProgress && (
                                        <div className="w-full">
                                            <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-1">
                                                <span>上传进度</span>
                                                <span>{uploadProgress.current} / {uploadProgress.total}</span>
                                            </div>
                                            <div className="w-full bg-cyan-100 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-cyan-500 to-teal-500 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            type="text"
                                            value={newRecordCaption}
                                            onChange={(e) => setNewRecordCaption(e.target.value)}
                                            className="flex-1 px-3 sm:px-4 py-2 border-2 border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-sm sm:text-base outline-none transition-all"
                                            placeholder="图片说明（可选，应用于所有图片）"
                                        />
                                        <label className={`px-3 sm:px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm sm:text-base rounded-xl hover:shadow-soft transition-all duration-300 cursor-pointer text-center ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            {uploadingImage ? '上传中...' : '上传图片'}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handleUploadImage}
                                                disabled={uploadingImage}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500"> 提示：支持同时选择多张图片进行上传</p>
                                </div>
                            </div>
                        )}

                        {records.length === 0 ? (
                            <p className="text-gray-600 text-center py-8 text-sm sm:text-base">暂无图文记录</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                {records.map((record) => (
                                    <div key={record.id} className="border-2 border-cyan-100 rounded-xl overflow-hidden hover:shadow-soft hover:-translate-y-1 transition-all duration-300 relative group bg-white/50">
                                        {isLoggedIn && (
                                            <>
                                                <button
                                                    onClick={() => setEditingRecord(record)}
                                                    className="absolute top-2 left-2 bg-white/90 text-cyan-500 hover:text-cyan-700 p-1.5 sm:p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow"
                                                    title="编辑说明"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRecord(record.id)}
                                                    className="absolute top-2 right-2 bg-white/90 text-red-500 hover:text-red-700 p-1.5 sm:p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow"
                                                    title="删除记录"
                                                >
                                                    🗑️
                                                </button>
                                            </>
                                        )}


                                        <div
                                            className="relative w-full h-40 sm:h-48 bg-cyan-100 cursor-zoom-in"
                                            onClick={() => setViewingImage(getOptimizedImageUrl(record.image_url))}
                                        >
                                            <RecordImage imageUrl={record.image_url} thumbUrl={record.thumb_url} alt={record.caption || '赛事记录'} />
                                        </div>


                                        {record.caption && (
                                            <div className="p-2 sm:p-3">
                                                <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">{record.caption}</p>
                                                <p className="text-xs text-gray-500 mt-1.5 sm:mt-2">
                                                    上传于 {new Date(record.created_at).toLocaleString('zh-CN')}
                                                   
                                                </p>
                                            </div>
                                        )}
                                        {!record.caption && isLoggedIn && (
                                            <div className="p-2 sm:p-3">
                                                <button
                                                    onClick={() => setEditingRecord(record)}
                                                    className="text-cyan-600 hover:text-cyan-700 text-xs sm:text-sm font-medium"
                                                >
                                                     添加说明
                                                </button>
                                                 <p className="text-xs text-gray-500 mt-1.5 sm:mt-2">
                                                    上传于 {new Date(record.created_at).toLocaleString('zh-CN')}
                                                   
                                                </p>
                                                
                                               
                                            </div>
                                        )}
                                        

                                        {/* 评论区 */}
                                        <div className="p-2 sm:p-3 border-t border-cyan-100 bg-cyan-50/50">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs sm:text-sm font-medium text-cyan-700">
                                                    💬 评论 ({record.comments?.length || 0})
                                                </span>
                                                <button
                                                    onClick={() => setViewingComments(viewingComments === record.id ? null : record.id)}
                                                    className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
                                                >
                                                    {viewingComments === record.id ? '收起回复' : '查看'}
                                                </button>
                                            </div>

                                            {viewingComments === record.id && (
                                                <div className="space-y-2">
                                                    {/* 评论列表 */}
                                                    {record.comments && record.comments.length > 0 ? (
                                                        <div className="max-h-32 overflow-y-auto space-y-1.5 mb-2">
                                                            {record.comments.map((comment: string, idx: number) => (
                                                                <div key={idx} className="text-xs bg-white rounded-lg p-2 border border-cyan-100">
                                                                    <p className="text-gray-700">{comment}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-gray-500 text-center py-2">暂无评论</p>
                                                    )}

                                                    {/* 发表评论 */}
                                                    {isLoggedIn && (
                                                        <div className="flex gap-1.5">
                                                            <input
                                                                type="text"
                                                                value={newComment}
                                                                onChange={(e) => setNewComment(e.target.value)}
                                                                className="flex-1 px-2 py-1.5 border-2 border-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300 text-xs outline-none transition-all"
                                                                placeholder="写下你的评论..."
                                                            />
                                                            <button
                                                                onClick={() => handleAddComment(record.id)}
                                                                className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-xs rounded-lg hover:shadow-soft transition-all duration-300 whitespace-nowrap"
                                                            >
                                                                发送
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>
                </div>



            </div>
            {/* 图片查看器 */}
            {viewingImage && (
                <ImageLightbox
                    imageUrl={viewingImage}
                    onClose={() => setViewingImage(null)}
                />
            )}




        </div>




    );
}


// 相册卡片图：优先用服务端签名的 .thumb.webp 小图（listRecords 返回的 thumb_url）；
// 老图/无小图/小图加载失败时回退到签名原图 image_url。
function RecordImage({ imageUrl, thumbUrl, alt }: { imageUrl: string; thumbUrl?: string | null; alt: string }) {
    const [current, setCurrent] = useState(thumbUrl || imageUrl);
    useEffect(() => {
        setCurrent(thumbUrl || imageUrl);
    }, [imageUrl, thumbUrl]);

    if (!imageUrl) {
        return (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">
                暂无图片
            </div>
        );
    }
    return (
        <Image
            src={current}
            alt={alt}
            fill
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
            placeholder="blur"
            blurDataURL={getBlurPlaceholder()}
            onError={() => {
                if (current !== imageUrl) setCurrent(imageUrl);
            }}
        />
    );
}

// 图片查看器组件
function ImageLightbox({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white text-4xl font-bold z-10"
            >
                ×
            </button>
            <div
                className="max-w-full max-h-full flex flex-col items-center gap-4"
                onClick={(e) => e.stopPropagation()}
            >
                <Image
                    src={imageUrl}
                    alt="查看大图"
                    width={1200}
                    height={800}
                    className="max-w-full max-h-[80vh] object-contain rounded-lg"
                    unoptimized
                />
                <a
                    href={imageUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-full text-sm transition-colors"
                >
                    下载原图
                </a>
            </div>
        </div>
    );
}

function AddTeamModal({ onClose, onAdd }: { onClose: () => void; onAdd: (data: any) => void }) {
    const [teamName, setTeamName] = useState('');
    const [captainId, setCaptainId] = useState('');
    const [captainName, setCaptainName] = useState('');
    const [players, setPlayers] = useState<{ user_id: string; name: string; position?: string }[]>([]);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const users = await listProfileSelect();
            setAvailableUsers(users || []);
        } catch (error) {
            console.error('获取用户列表失败:', error);
        }
    };

    const handleCaptainChange = (userId: string) => {
        setCaptainId(userId);
        const user = availableUsers.find(u => u.id === userId);
        setCaptainName(user?.username || '');
    };

    const handleAddPlayer = (userId: string) => {
        if (!userId) return;
        const user = availableUsers.find(u => u.id === userId);
        if (!user) return;

        // 检查是否已经添加
        if (players.some(p => p.user_id === userId)) {
            alert('该用户已经在队伍中了');
            return;
        }

        setPlayers([...players, { user_id: userId, name: user.username }]);
    };

    const handleRemovePlayer = (userId: string) => {
        setPlayers(players.filter(p => p.user_id !== userId));
    };

    const handleSubmit = () => {
        if (!teamName || !captainId) {
            alert('请填写队名和选择队长');
            return;
        }

        onAdd({
            team_name: teamName,
            captain_name: captainName,
            players: players,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-soft-lg border-2 border-cyan-100">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-700 to-teal-700 mb-4">添加参赛队伍</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">队名 *</label>
                        <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="w-full px-4 py-2 border-2 border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all"
                            placeholder="请输入队名"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">队长 *</label>
                        <select
                            value={captainId}
                            onChange={(e) => handleCaptainChange(e.target.value)}
                            className="w-full px-4 py-2 border-2 border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all"
                        >
                            <option value="">选择队长</option>
                            {availableUsers.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.username}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">队员列表</label>
                        <div className="flex gap-2 mb-2">
                            <select
                                onChange={(e) => {
                                    if (e.target.value) {
                                        handleAddPlayer(e.target.value);
                                        e.target.value = ''; // 重置选择
                                    }
                                }}
                                className="flex-1 px-4 py-2 border-2 border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all"
                            >
                                <option value="">选择要添加的队员</option>
                                {availableUsers
                                    .filter(user => user.id !== captainId && !players.some(p => p.user_id === user.id))
                                    .map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.username}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        {players.length > 0 && (
                            <ul className="border-2 border-cyan-100 rounded-xl divide-y bg-white/50">
                                {players.map((player) => (
                                    <li key={player.user_id} className="px-4 py-2 flex justify-between items-center">
                                        <span className="text-gray-700">{player.name}</span>
                                        <button
                                            onClick={() => handleRemovePlayer(player.user_id)}
                                            className="text-red-500 hover:text-red-700 text-sm font-medium bg-red-50 px-3 py-1 rounded-lg hover:bg-red-100 transition-colors"
                                        >
                                            删除
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex gap-2 justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl hover:shadow-soft transition-all duration-300"
                    >
                        确认添加
                    </button>
                </div>
            </div>
        </div>
    );
}


function EditTeamModal({ team, onClose, onEdit }: { team: Team; onClose: () => void; onEdit: (data: any) => void }) {
    const [teamName, setTeamName] = useState(team.team_name);
    const [captainId, setCaptainId] = useState('');
    const [captainName, setCaptainName] = useState(team.captain_name);
    const [players, setPlayers] = useState<TeamPlayer[]>(team.players || []);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const users = await listProfileSelect();
            setAvailableUsers(users || []);

            // 找到当前队长的ID
            const currentCaptain = users?.find(u => u.username === team.captain_name);
            if (currentCaptain) {
                setCaptainId(currentCaptain.id);
            }
        } catch (error) {
            console.error('获取用户列表失败:', error);
        }
    };

    const handleCaptainChange = (userId: string) => {
        setCaptainId(userId);
        const user = availableUsers.find(u => u.id === userId);
        setCaptainName(user?.username || '');
    };

    const handleAddPlayer = (userId: string) => {
        if (!userId) return;
        const user = availableUsers.find(u => u.id === userId);
        if (!user) return;

        // 检查是否已经添加
        if (players.some(p => p.user_id === userId)) {
            alert('该用户已经在队伍中了');
            return;
        }

        setPlayers([...players, { user_id: userId, name: user.username }]);
    };

    const handleRemovePlayer = (userId: string) => {
        setPlayers(players.filter(p => p.user_id !== userId));
    };

    const handleSubmit = () => {
        if (!teamName || !captainId) {
            alert('请填写队名和选择队长');
            return;
        }

        onEdit({
            team_name: teamName,
            captain_name: captainName,
            players: players,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-soft-lg border-2 border-cyan-100">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-700 to-teal-700 mb-4">编辑队伍信息</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">队名 *</label>
                        <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="w-full px-4 py-2 border-2 border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all"
                            placeholder="请输入队名"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">队长 *</label>
                        <select
                            value={captainId}
                            onChange={(e) => handleCaptainChange(e.target.value)}
                            className="w-full px-4 py-2 border-2 border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all"
                        >
                            <option value="">选择队长</option>
                            {availableUsers.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.username}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">队员列表</label>
                        <div className="flex gap-2 mb-2">
                            <select
                                onChange={(e) => {
                                    if (e.target.value) {
                                        handleAddPlayer(e.target.value);
                                        e.target.value = ''; // 重置选择
                                    }
                                }}
                                className="flex-1 px-4 py-2 border-2 border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all"
                            >
                                <option value="">选择要添加的队员</option>
                                {availableUsers
                                    .filter(user => user.id !== captainId && !players.some(p => p.user_id === user.id))
                                    .map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.username}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        {players.length > 0 && (
                            <ul className="border-2 border-cyan-100 rounded-xl divide-y bg-white/50">
                                {players.map((player) => (
                                    <li key={player.user_id} className="px-4 py-2 flex justify-between items-center">
                                        <span className="text-gray-700">{player.name}</span>
                                        <button
                                            onClick={() => handleRemovePlayer(player.user_id)}
                                            className="text-red-500 hover:text-red-700 text-sm font-medium bg-red-50 px-3 py-1 rounded-lg hover:bg-red-100 transition-colors"
                                        >
                                            删除
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex gap-2 justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl hover:shadow-soft transition-all duration-300"
                    >
                        保存修改
                    </button>
                </div>
            </div>
        </div>
    );
}




function EditRecordCaptionModal({ record, onClose, onEdit }: { record: Record; onClose: () => void; onEdit: (id: string, caption: string) => void }) {
        const [caption, setCaption] = useState(record.caption);

        const handleSubmit = () => {
            onEdit(record.id, caption);
        };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-soft-lg border-2 border-cyan-100">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-700 to-teal-700 mb-4">编辑图片说明</h2>

                <div className="mb-4">
                    <img
                        src={record.image_url}
                        alt={caption || '图片预览'}
                        className="w-full h-64 object-cover rounded-xl mb-4 border-2 border-cyan-100"
                    />
                    <label className="block text-sm font-medium text-gray-700 mb-2">说明文字</label>
                    <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all"
                        rows={4}
                        placeholder="请输入图片说明..."
                    />
                </div>

                <div className="flex gap-2 justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl hover:shadow-soft transition-all duration-300"
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>
    );
}

function RecordResultsModal({ matchId, teams, onClose, onSave }: { matchId: string; teams: Team[]; onClose: () => void; onSave: () => void }) {
    const [results, setResults] = useState<any[]>([]);
    const [achievements, setAchievements] = useState<any[]>([]);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchExistingData();
        fetchUsers();
    }, [teams, matchId]);

    const fetchExistingData = async () => {
        try {
            const existingResults = await getExistingTeamResults(matchId);

            if (existingResults) {
                const resultsWithTeamNames = teams.map(team => {
                    const existing = existingResults.find(r => r.team_id === team.id);
                    return {
                        team_id: team.id,
                        team_name: team.team_name,
                        rank: existing?.rank || 0,
                        is_winner: existing?.is_winner || false
                    };
                });
                setResults(resultsWithTeamNames);
            } else {
                const initialResults = teams.map(team => ({
                    team_id: team.id,
                    team_name: team.team_name,
                    rank: 0,
                    is_winner: false
                }));
                setResults(initialResults);
            }

            const existingAchievements = await listMatchAchievements(matchId);

            if (existingAchievements) {
                setAchievements(existingAchievements.map((a, idx) => ({
                    ...a,
                    id: a.id || Date.now() + idx
                })));
            }
        } catch (error) {
            console.error('获取已有数据失败:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const users = await listProfileSelect();
            setAvailableUsers(users || []);
        } catch (error) {
            console.error('获取用户列表失败:', error);
        }
    };

    const updateResult = (teamId: string, field: string, value: any) => {
        setResults(prev => prev.map(result =>
            result.team_id === teamId ? { ...result, [field]: value } : result
        ));
    };

    const addAchievement = () => {
        setAchievements(prev => [...prev, {
            id: Date.now(),
            user_id: '',
            achievement_type: 'participation',
            title: '',
            description: '',
            team_id: '',
            match_id: matchId
        }]);
    };

    const updateAchievement = (id: number, field: string, value: any) => {
        setAchievements(prev => prev.map(achievement =>
            achievement.id === id ? { ...achievement, [field]: value } : achievement
        ));
    };

    const removeAchievement = async (id: number) => {
        const achievement = achievements.find(a => a.id === id);
        if (achievement && achievement.id && typeof achievement.id === 'string') {
            try {
                await deleteAchievement(achievement.id);
            } catch (error) {
                console.error('删除荣誉失败:', error);
            }
        }
        setAchievements(prev => prev.filter(achievement => achievement.id !== id));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const validResults = results.filter(r => r.rank > 0);

            if (validResults.length > 0) {
                await upsertTeamResults(
                    matchId,
                    validResults.map(r => ({
                        team_id: r.team_id,
                        rank: r.rank
                    }))
                );
            }

            const validAchievements = achievements.filter(a => a.user_id && a.title);

            for (const achievement of validAchievements) {
                await upsertAchievement({
                    id: achievement.id && typeof achievement.id === 'string' ? achievement.id : null,
                    user_id: achievement.user_id,
                    match_id: matchId,
                    team_id: achievement.team_id || null,
                    achievement_type: achievement.achievement_type || 'participation',
                    title: achievement.title,
                    description: achievement.description || ''
                });
            }

            alert('比赛结果已保存！');
            onSave();
            onClose();
        } catch (error: any) {
            console.error('保存失败:', error);
            alert('保存失败: ' + (error.message || '请重试'));
        } finally {
            setSaving(false);
        }
    };



    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-soft-lg border-2 border-cyan-100">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-700 to-teal-700 mb-6">记录比赛结果</h2>

                {/* 队伍排名 */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">队伍排名</h3>
                    <div className="space-y-3">
                        {results.map((result, index) => (
                            <div key={result.team_id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                <div className="w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <span className="font-medium text-gray-800">{result.team_name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-600">排名:</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={teams.length}
                                        value={result.rank || ''}
                                        onChange={(e) => updateResult(result.team_id, 'rank', parseInt(e.target.value) || 0)}
                                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                                        placeholder="名次"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 用户荣誉 */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">颁发荣誉</h3>
                        <button
                            onClick={addAchievement}
                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm rounded-xl hover:shadow-soft transition-all duration-300"
                        >
                            + 添加荣誉
                        </button>
                    </div>
                    <div className="space-y-3">
                        {achievements.map((achievement) => (
                            <div key={achievement.id} className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">获得者</label>



                                        <select
                                            value={achievement.user_id}
                                            onChange={(e) => updateAchievement(achievement.id, 'user_id', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        >
                                            <option value="">选择用户</option>
                                            {availableUsers
                                                .filter(user => user.id) // 只保留有 ID 的用户
                                                .sort((a, b) => {
                                                    const nameA = a.username || a.full_name || '';
                                                    const nameB = b.username || b.full_name || '';
                                                    return nameA.localeCompare(nameB, 'zh-CN');
                                                })
                                                .map((user) => {
                                                    const displayName = user.username || user.full_name || '未知用户';
                                                    return (
                                                        <option key={user.id} value={user.id}>
                                                            {displayName}
                                                        </option>
                                                    );
                                                })}
                                        </select>




                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">荣誉称号</label>
                                    <input
                                        type="text"
                                        value={achievement.title}
                                        onChange={(e) => updateAchievement(achievement.id, 'title', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        placeholder="例如：冠军、MVP等"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">详细描述</label>
                                    <textarea
                                        value={achievement.description}
                                        onChange={(e) => updateAchievement(achievement.id, 'description', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        rows={2}
                                        placeholder="荣誉的详细描述..."
                                    />
                                </div>
                                <button
                                    onClick={() => removeAchievement(achievement.id)}
                                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                                >
                                    删除此荣誉
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2 justify-end">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-6 py-2 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors disabled:opacity-50"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl hover:shadow-soft transition-all duration-300"
                    >
                        {saving ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                保存中...
                            </>
                        ) : (
                            '保存结果'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
