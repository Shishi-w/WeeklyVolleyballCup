'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getOptimizedImageUrl, getBlurPlaceholder } from '@/lib/imageUtils';
import { VolleyballIcon, LoadingIcon, FlowerIcon } from '@/components/Icons';

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
    caption: string;
    edited_by_username: string | null;
    updated_at: string;
    comments?: string[];
};

type Team = {
    id: string;
    team_name: string;
    captain_name: string;
    captain_contact: string;
    players: any[];
    expected_position: string;
};

export default function MatchDetailPage() {
    const params = useParams();
    const matchId = params.id as string;
    const supabase = createClient();

    const [match, setMatch] = useState<Match | null>(null);
    const [theme, setTheme] = useState<Theme | null>(null);
    const [rule, setRule] = useState<Rule | null>(null);
    const [result, setResult] = useState<Result | null>(null);
    const [records, setRecords] = useState<Record[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTheme, setEditingTheme] = useState(false);
    const [editingRule, setEditingRule] = useState(false);
    const [editingResult, setEditingResult] = useState(false);
    const [themeContent, setThemeContent] = useState('');
    const [ruleContent, setRuleContent] = useState('');
    const [resultContent, setResultContent] = useState('');
    const [showAddTeam, setShowAddTeam] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [newRecordCaption, setNewRecordCaption] = useState('');
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [editingRecord, setEditingRecord] = useState<Record | null>(null);
    const [viewingComments, setViewingComments] = useState<string | null>(null);
    const [newComment, setNewComment] = useState('');

    const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

    useEffect(() => {
        checkAuth();
        fetchData();
    }, [matchId]);


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
            const { data: { user } } = await supabase.auth.getUser();
            let successCount = 0;

            for (let i = 0; i < validFiles.length; i++) {
                const file = validFiles[i];
                if (!file) continue;

                const fileExt = file.name.split('.').pop();
                const fileName = `${matchId}-${Date.now()}-${i}.${fileExt}`;

                try {
                    const { error: uploadError } = await supabase.storage
                        .from('match-images')
                        .upload(fileName, file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('match-images')
                        .getPublicUrl(fileName);

                    const recordData = {
                        match_id: matchId,
                        image_url: publicUrl,
                        caption: newRecordCaption || '',
                        edited_by: user?.email || 'Anonymous',
                        edited_by_username: user?.user_metadata?.username || '匿名用户',
                    };

                    const { error: insertError } = await supabase
                        .from('match_records')
                        .insert([recordData]);

                    if (insertError) throw insertError;

                    successCount++;
                    setUploadProgress({ current: i + 1, total: validFiles.length });
                } catch (error) {
                    console.error(`上传第 ${i + 1} 张图片失败:`, error);
                }
            }

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

    const checkAuth = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setIsLoggedIn(!!user);
            setUserId(user?.id || null);
        } catch (error) {
            setIsLoggedIn(false);
            setUserId(null);
        }
    };

    const fetchData = async () => {
        try {
            const { data: matchData, error: matchError } = await supabase
                .from('matches')
                .select('*')
                .eq('id', matchId)
                .single();

            if (matchError) throw matchError;
            setMatch(matchData);

            const { data: themeData, error: themeError } = await supabase
                .from('match_themes')
                .select('*')
                .eq('match_id', matchId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (themeError) throw themeError;
            setTheme(themeData);
            if (themeData) setThemeContent(themeData.content);

            const { data: ruleData, error: ruleError } = await supabase
                .from('match_rules')
                .select('*')
                .eq('match_id', matchId)
                .maybeSingle();

            if (ruleError) throw ruleError;
            setRule(ruleData);
            if (ruleData) setRuleContent(ruleData.content);

            const { data: resultData, error: resultError } = await supabase
                .from('match_results')
                .select('*')
                .eq('match_id', matchId)
                .maybeSingle();

            if (resultError) throw resultError;
            setResult(resultData);
            if (resultData) setResultContent(resultData.content);

            const { data: recordsData, error: recordsError } = await supabase
                .from('match_records')
                .select('*')
                .eq('match_id', matchId)
                .order('created_at', { ascending: false });

            if (recordsError) throw recordsError;
            setRecords(recordsData || []);

            const { data: teamsData, error: teamsError } = await supabase
                .from('teams')
                .select('*')
                .eq('match_id', matchId)
                .order('created_at', { ascending: true });

            if (teamsError) throw teamsError;
            setTeams(teamsData || []);
        } catch (error) {
            console.error('获取数据失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const canEdit = isLoggedIn && match?.status !== 'completed';

    const handleRedirectToLogin = () => {
        const currentPath = window.location.pathname;
        window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(currentPath)}`;
    };

    const handleSaveTheme = async () => {
        if (!canEdit) {
            if (!isLoggedIn) {
                handleRedirectToLogin();
                return;
            }
            alert(match?.status === 'completed' ? '已结束的赛事不能编辑' : '请先登录后再编辑主题');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const themeData = {
                match_id: matchId,
                content: themeContent,
                edited_by: user?.email || 'Anonymous',
                edited_by_username: user?.user_metadata?.username || '匿名用户',
            };

            if (theme) {
                const { error } = await supabase
                    .from('match_themes')
                    .update(themeData)
                    .eq('id', theme.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('match_themes')
                    .insert([themeData]);
                if (error) throw error;
            }

            setEditingTheme(false);
            fetchData();
            alert('主题已保存');
        } catch (error) {
            console.error('保存主题失败:', error);
            alert('保存失败，请重试');
        }
    };

    const handleSaveRule = async () => {
        if (!isLoggedIn) {
            handleRedirectToLogin();
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const ruleData = {
                match_id: matchId,
                content: ruleContent,
                edited_by: user?.email || 'Anonymous',
                edited_by_username: user?.user_metadata?.username || '匿名用户',
            };

            if (rule) {
                const { error } = await supabase
                    .from('match_rules')
                    .update(ruleData)
                    .eq('id', rule.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('match_rules')
                    .insert([ruleData]);
                if (error) throw error;
            }

            setEditingRule(false);
            fetchData();
            alert('规则已保存');
        } catch (error) {
            console.error('保存规则失败:', error);
            alert('保存失败，请重试');
        }
    };

    const handleSaveResult = async () => {
        if (!isLoggedIn) {
            handleRedirectToLogin();
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const resultData = {
                match_id: matchId,
                content: resultContent,
                edited_by: user?.email || 'Anonymous',
                edited_by_username: user?.user_metadata?.username || '匿名用户',
            };

            if (result) {
                const { error } = await supabase
                    .from('match_results')
                    .update(resultData)
                    .eq('id', result.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('match_results')
                    .insert([resultData]);
                if (error) throw error;
            }

            setEditingResult(false);
            fetchData();
            alert('结果已保存');
        } catch (error) {
            console.error('保存结果失败:', error);
            alert('保存失败，请重试');
        }
    };



    const handleDeleteRecord = async (recordId: string) => {
        if (!isLoggedIn) {
            handleRedirectToLogin();
            return;
        }

        if (!confirm('确定要删除这条记录吗？')) return;

        try {
            const { error } = await supabase
                .from('match_records')
                .delete()
                .eq('id', recordId);

            if (error) throw error;

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
            alert(match?.status === 'completed' ? '已结束的赛事不能添加队伍' : '请先登录后再添加队伍');
            return;
        }

        try {
            const { error } = await supabase
                .from('teams')
                .insert([{ 
                    team_name: teamData.team_name,
                    captain_name: teamData.captain_name,
                    players: teamData.players,
                    match_id: matchId 
                }]);

            if (error) throw error;

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
        alert(match?.status === 'completed' ? '已结束的赛事不能删除队伍' : '请先登录后再删除队伍');
        return;
    }

    if (!confirm('确定要删除这支队伍吗？')) return;

    try {
        const { error } = await supabase
            .from('teams')
            .delete()
            .eq('id', teamId);

        if (error) throw error;

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
            alert(match?.status === 'completed' ? '已结束的赛事不能编辑队伍' : '请先登录后再编辑队伍');
            return;
        }

        try {
            const { error } = await supabase
                .from('teams')
                .update({
                    team_name: teamData.team_name,
                    captain_name: teamData.captain_name,
                    players: teamData.players,
                })
                .eq('id', editingTeam.id);

            if (error) throw error;

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
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase
                .from('match_records')
                .update({
                    caption: newCaption,
                    edited_by: user?.email || 'Anonymous',
                    edited_by_username: user?.user_metadata?.username || '匿名用户',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', recordId);

            if (error) throw error;

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
            const { data: { user } } = await supabase.auth.getUser();
            const record = records.find(r => r.id === recordId);
            const currentComments = record?.comments || [];
            const commentWithAuthor = `${user?.user_metadata?.username || '匿名用户'}: ${newComment}`;

            const { error } = await supabase
                .from('match_records')
                .update({
                    comments: [...currentComments, commentWithAuthor],
                })
                .eq('id', recordId);

            if (error) throw error;

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
                                ✅ 已结束 (可编辑)
                            </span>
                        )}
                    </div>
                    <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base line-clamp-2 leading-relaxed">{match.description}</p>
                    <div className="flex flex-col sm:flex-row gap-2 text-xs sm:text-sm text-gray-500">
                        <span>开始：{new Date(match.start_date).toLocaleString('zh-CN')}</span>
                        <span>结束：{new Date(match.end_date).toLocaleString('zh-CN')}</span>
                    </div>
                </div>

                {/* Theme and Rules Section */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft-lg p-4 sm:p-6 mb-6 sm:mb-8 border-2 border-cyan-100">
                    <h2 className="text-lg sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-700 to-teal-700 mb-4">赛事信息与规则</h2>

                    {/* Theme */}
                    <div className="mb-6 pb-6 border-b border-cyan-100 last:border-0 last:pb-0 last:mb-0">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2">
                            <h3 className="text-base sm:text-xl font-semibold text-cyan-800">本周主题</h3>
                            {canEdit ? (
                                <button
                                    onClick={() => setEditingTheme(!editingTheme)}
                                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm sm:text-base rounded-xl hover:shadow-soft transition-all duration-300 w-full sm:w-auto"
                                >
                                    {editingTheme ? '取消编辑' : '编辑主题'}
                                </button>
                            ) : (
                                <button
                                    onClick={handleRedirectToLogin}
                                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-300 text-white text-sm sm:text-base rounded-xl hover:bg-gray-400 transition-colors w-full sm:w-auto cursor-not-allowed"
                                >
                                    🔒 登录后可编辑
                                </button>
                            )}
                        </div>

                        {editingTheme && canEdit ? (
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
                            {isLoggedIn ? (
                                <button
                                    onClick={() => setEditingRule(!editingRule)}
                                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm sm:text-base rounded-xl hover:shadow-soft transition-all duration-300 w-full sm:w-auto"
                                >
                                    {editingRule ? '取消编辑' : '编辑规则'}
                                </button>
                            ) : (
                                <button
                                    onClick={handleRedirectToLogin}
                                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-300 text-white text-sm sm:text-base rounded-xl hover:bg-gray-400 transition-colors w-full sm:w-auto cursor-not-allowed"
                                >
                                    🔒 登录后可编辑
                                </button>
                            )}
                        </div>

                        {editingRule && isLoggedIn ? (
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
                        {canEdit ? (
                            <button
                                onClick={() => setShowAddTeam(true)}
                                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm sm:text-base rounded-xl hover:shadow-soft transition-all duration-300 w-full sm:w-auto flex items-center justify-center gap-2"
                            >
                                <span className="text-lg">+</span> 添加队伍
                            </button>
                        ) : (
                            <button
                                onClick={handleRedirectToLogin}
                                className="px-4 py-2 bg-gray-300 text-white text-sm sm:text-base rounded-xl hover:bg-gray-400 transition-colors w-full sm:w-auto cursor-not-allowed"
                            >
                                🔒 登录后可添加
                            </button>
                        )}
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

                {/* Results and Records Section */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft-lg p-4 sm:p-6 mt-6 sm:mt-8 border-2 border-cyan-100">
                    <h2 className="text-lg sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-700 to-teal-700 mb-4 sm:mb-6">赛事结果与记录</h2>

                    {/* Results */}
                    <div className="mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-cyan-100 last:border-0 last:pb-0 last:mb-0">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2">
                            <h3 className="text-base sm:text-xl font-semibold text-cyan-800">赛事结果公示</h3>
                            {isLoggedIn ? (
                                <button
                                    onClick={() => setEditingResult(!editingResult)}
                                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm sm:text-base rounded-xl hover:shadow-soft transition-all duration-300 w-full sm:w-auto"
                                >
                                    {editingResult ? '取消编辑' : '编辑结果'}
                                </button>
                            ) : (
                                <button
                                    onClick={handleRedirectToLogin}
                                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-300 text-white text-sm sm:text-base rounded-xl hover:bg-gray-400 transition-colors w-full sm:w-auto cursor-not-allowed"
                                >
                                    🔒 登录后可编辑
                                </button>
                            )}
                        </div>

                        {editingResult && isLoggedIn ? (
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
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input
                                        type="text"
                                        value={newRecordCaption}
                                        onChange={(e) => setNewRecordCaption(e.target.value)}
                                        className="flex-1 px-3 sm:px-4 py-2 border-2 border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-sm sm:text-base outline-none transition-all"
                                        placeholder="图片说明（可选）"
                                    />
                                    <label className="px-3 sm:px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm sm:text-base rounded-xl hover:shadow-soft transition-all duration-300 cursor-pointer text-center">
                                        {uploadingImage ? '上传中...' : '上传图片'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleUploadImage}
                                            disabled={uploadingImage}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>
                        )}

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
                                            {uploadingImage ? '上传中...' : '📷 批量上传图片'}
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
                                    <p className="text-xs text-gray-500">💡 提示：支持同时选择多张图片进行上传</p>
                                </div>
                            </div>
                        )}

                        {!isLoggedIn && (
                            <div className="mb-4 sm:mb-6 text-center">
                                <button
                                    onClick={handleRedirectToLogin}
                                    className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-300 text-white text-sm sm:text-base rounded-xl hover:bg-gray-400 transition-colors cursor-not-allowed w-full sm:w-auto"
                                >
                                    📷 登录即可上传赛事照片
                                </button>
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
                                        <div className="relative w-full h-40 sm:h-48 bg-cyan-100">
                                            <Image
                                                src={getOptimizedImageUrl(record.image_url, 800, 75)}
                                                alt={record.caption || '赛事记录'}
                                                fill
                                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                loading="lazy"
                                                placeholder="blur"
                                                blurDataURL={getBlurPlaceholder()}
                                            />
                                        </div>
                                        {record.caption && (
                                            <div className="p-2 sm:p-3">
                                                <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">{record.caption}</p>
                                                <p className="text-xs text-gray-500 mt-1.5 sm:mt-2">
                                                    {record.edited_by_username} · {new Date(record.updated_at).toLocaleString('zh-CN')}
                                                </p>
                                            </div>
                                        )}
                                        {!record.caption && isLoggedIn && (
                                            <div className="p-2 sm:p-3">
                                                <button
                                                    onClick={() => setEditingRecord(record)}
                                                    className="text-cyan-600 hover:text-cyan-700 text-xs sm:text-sm font-medium"
                                                >
                                                    📝 添加说明
                                                </button>
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
                                                            {record.comments.map((comment, idx) => (
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
        </div>
    );
}

function AddTeamModal({ onClose, onAdd }: { onClose: () => void; onAdd: (data: any) => void }) {
    const [teamName, setTeamName] = useState('');
    const [captainName, setCaptainName] = useState('');
    const [players, setPlayers] = useState<any[]>([]);
    const [newPlayerName, setNewPlayerName] = useState('');
    const handleAddPlayer = () => {
        if (!newPlayerName.trim()) return;
        setPlayers([...players, { name: newPlayerName }]);
        setNewPlayerName('');
    };

    const handleRemovePlayer = (index: number) => {
        setPlayers(players.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (!teamName || !captainName) {
            alert('请填写队名和队长姓名');
            return;
        }

        onAdd({
            team_name: teamName,
            captain_name: captainName,
            players: players,
        });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAddPlayer();
        }
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">队长姓名 *</label>
                        <input
                            type="text"
                            value={captainName}
                            onChange={(e) => setCaptainName(e.target.value)}
                            className="w-full px-4 py-2 border-2 border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all"
                            placeholder="请输入队长姓名"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">队员列表</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={newPlayerName}
                                onChange={(e) => setNewPlayerName(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="flex-1 px-4 py-2 border-2 border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all"
                                placeholder="队员姓名"
                            />
                            <button
                                onClick={handleAddPlayer}
                                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl hover:shadow-soft transition-all duration-300"
                            >
                                添加
                            </button>
                        </div>
                        {players.length > 0 && (
                            <ul className="border-2 border-cyan-100 rounded-xl divide-y bg-white/50">
                                {players.map((player, idx) => (
                                    <li key={idx} className="px-4 py-2 flex justify-between items-center">
                                        <span className="text-gray-700">{player.name}</span>
                                        <button
                                            onClick={() => handleRemovePlayer(idx)}
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
    const [captainName, setCaptainName] = useState(team.captain_name);
    const [players, setPlayers] = useState<any[]>(team.players || []);
    const [newPlayerName, setNewPlayerName] = useState('');

    const handleAddPlayer = () => {
        if (!newPlayerName.trim()) return;
        setPlayers([...players, { name: newPlayerName }]);
        setNewPlayerName('');
    };

    const handleRemovePlayer = (index: number) => {
        setPlayers(players.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (!teamName || !captainName) {
            alert('请填写队名和队长姓名');
            return;
        }

        onEdit({
            team_name: teamName,
            captain_name: captainName,
            players: players,
        });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAddPlayer();
        }
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">队长姓名 *</label>
                        <input
                            type="text"
                            value={captainName}
                            onChange={(e) => setCaptainName(e.target.value)}
                            className="w-full px-4 py-2 border-2 border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all"
                            placeholder="请输入队长姓名"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">队员列表</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={newPlayerName}
                                onChange={(e) => setNewPlayerName(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="flex-1 px-4 py-2 border-2 border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all"
                                placeholder="队员姓名"
                            />
                            <button
                                onClick={handleAddPlayer}
                                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl hover:shadow-soft transition-all duration-300"
                            >
                                添加
                            </button>
                        </div>
                        {players.length > 0 && (
                            <ul className="border-2 border-cyan-100 rounded-xl divide-y bg-white/50">
                                {players.map((player, idx) => (
                                    <li key={idx} className="px-4 py-2 flex justify-between items-center">
                                        <span className="text-gray-700">{player.name}</span>
                                        <button
                                            onClick={() => handleRemovePlayer(idx)}
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
