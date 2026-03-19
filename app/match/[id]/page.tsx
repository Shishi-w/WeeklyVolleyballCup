'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { useParams } from 'next/navigation';
import Link from 'next/link';

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

    useEffect(() => {
        checkAuth();
        fetchData();
    }, [matchId]);

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

    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isLoggedIn) {
            handleRedirectToLogin();
            return;
        }

        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('请上传图片文件');
            return;
        }

        setUploadingImage(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const fileExt = file.name.split('.').pop();
            const fileName = `${matchId}-${Date.now()}.${fileExt}`;

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

            setNewRecordCaption('');
            fetchData();
            alert('图片已上传');
        } catch (error) {
            console.error('上传图片失败:', error);
            alert('上传失败，请重试');
        } finally {
            setUploadingImage(false);
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">加载中...</p>
                </div>
            </div>
        );
    }

    if (!match) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">赛事不存在</p>
                    <Link href="/timeline" className="text-blue-600 hover:underline mt-4 block">
                        返回时间轴
                    </Link>
                </div>
            </div>
        );
    }

    const isCompleted = match.status === 'completed';

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
            <div className="container mx-auto px-4 py-8">
                <Link href="/timeline" className="text-blue-600 hover:underline mb-6 inline-block">
                    ← 返回时间轴
                </Link>

                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-4xl font-bold text-blue-900">{match.name}</h1>
                        {isCompleted && (
                            <span className="bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium">
                                🏁 已结束
                            </span>
                        )}
                    </div>
                    <p className="text-gray-600 mb-4">{match.description}</p>
                    <div className="flex gap-4 text-sm text-gray-500 flex-wrap">
                        <span>开始：{new Date(match.start_date).toLocaleString('zh-CN')}</span>
                        <span>结束：{new Date(match.end_date).toLocaleString('zh-CN')}</span>
                    </div>
                </div>

                {/* Theme and Rules Section */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-2xl font-bold text-blue-900 mb-4">赛事信息与规则</h2>
                    
                    {/* Theme */}
                    <div className="mb-6 pb-6 border-b">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-blue-800">本周主题</h3>
                            {canEdit ? (
                                <button
                                    onClick={() => setEditingTheme(!editingTheme)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {editingTheme ? '取消编辑' : '编辑主题'}
                                </button>
                            ) : isCompleted ? (
                                <span className="text-sm text-gray-600 bg-gray-200 px-3 py-1 rounded-full">
                                    🏁 已结束，不可编辑
                                </span>
                            ) : (
                                <button
                                    onClick={handleRedirectToLogin}
                                    className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors text-sm cursor-not-allowed"
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
                                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={6}
                                    placeholder="请输入本周主题..."
                                />
                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={handleSaveTheme}
                                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        保存
                                    </button>
                                    <button
                                        onClick={() => setEditingTheme(false)}
                                        className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                                    >
                                        取消
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="prose max-w-none">
                                <p className="text-gray-700 whitespace-pre-wrap">{theme?.content || '暂无主题内容'}</p>
                                {theme && (
                                    <p className="text-sm text-gray-500 mt-4">
                                        最后编辑：{theme.edited_by_username} · {new Date(theme.updated_at).toLocaleString('zh-CN')}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Rules */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-blue-800">赛事规则</h3>
                            {isLoggedIn ? (
                                <button
                                    onClick={() => setEditingRule(!editingRule)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {editingRule ? '取消编辑' : '编辑规则'}
                                </button>
                            ) : (
                                <button
                                    onClick={handleRedirectToLogin}
                                    className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors text-sm cursor-not-allowed"
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
                                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={8}
                                    placeholder="请输入赛事规则..."
                                />
                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={handleSaveRule}
                                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        保存
                                    </button>
                                    <button
                                        onClick={() => setEditingRule(false)}
                                        className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                                    >
                                        取消
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="prose max-w-none">
                                <p className="text-gray-700 whitespace-pre-wrap">{rule?.content || '暂无规则内容'}</p>
                                {rule && (
                                    <p className="text-sm text-gray-500 mt-4">
                                        最后编辑：{rule.edited_by_username} · {new Date(rule.updated_at).toLocaleString('zh-CN')}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Teams Section */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-blue-900">参赛队伍</h2>
                        {canEdit ? (
                            <button
                                onClick={() => setShowAddTeam(true)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                + 添加队伍
                            </button>
                        ) : isCompleted ? (
                            <span className="text-sm text-gray-600 bg-gray-200 px-3 py-1 rounded-full">
                                🏁 已结束，不可添加
                            </span>
                        ) : (
                            <button
                                onClick={handleRedirectToLogin}
                                className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors text-sm cursor-not-allowed"
                            >
                                🔒 登录后可添加
                            </button>
                        )}
                    </div>

                    {teams.length === 0 ? (
                        <p className="text-gray-600 text-center py-8">暂无参赛队伍</p>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {teams.map((team) => (
                                <div key={team.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative">
                                    {canEdit && (
                                        <button
                                            onClick={() => handleDeleteTeam(team.id)}
                                            className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm font-medium"
                                            title="删除队伍"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                    <h3 className="text-xl font-bold text-blue-900 mb-3">{team.team_name}</h3>
                                    <div className="space-y-2 text-sm">
                                        <p><span className="font-medium text-gray-600">队长：</span>{team.captain_name}</p>
                                        {team.players && team.players.length > 0 && (
                                            <div className="mt-3 pt-3 border-t">
                                                <p className="font-medium text-gray-600 mb-2">队员 ({team.players.length}):</p>
                                                <ul className="space-y-1">
                                                    {team.players.map((player, idx) => (
                                                        <li key={idx} className="text-gray-700">
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

                {/* Results and Records Section */}
                <div className="bg-white rounded-lg shadow-md p-6 mt-8">
                    <h2 className="text-2xl font-bold text-blue-900 mb-6">赛事结果与记录</h2>

                    {/* Results */}
                    <div className="mb-8 pb-8 border-b">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-blue-800">赛事结果公示</h3>
                            {isLoggedIn ? (
                                <button
                                    onClick={() => setEditingResult(!editingResult)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {editingResult ? '取消编辑' : '编辑结果'}
                                </button>
                            ) : (
                                <button
                                    onClick={handleRedirectToLogin}
                                    className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors text-sm cursor-not-allowed"
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
                                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={8}
                                    placeholder="请输入赛事结果..."
                                />
                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={handleSaveResult}
                                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        保存
                                    </button>
                                    <button
                                        onClick={() => setEditingResult(false)}
                                        className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                                    >
                                        取消
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="prose max-w-none">
                                <p className="text-gray-700 whitespace-pre-wrap">{result?.content || '暂无结果公示'}</p>
                                {result && (
                                    <p className="text-sm text-gray-500 mt-4">
                                        最后编辑：{result.edited_by_username} · {new Date(result.updated_at).toLocaleString('zh-CN')}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Records */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-blue-800">赛事图文记录</h3>
                        </div>

                        {isLoggedIn && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        value={newRecordCaption}
                                        onChange={(e) => setNewRecordCaption(e.target.value)}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="图片说明（可选）"
                                    />
                                    <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
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

                        {!isLoggedIn && (
                            <div className="mb-6 text-center">
                                <button
                                    onClick={handleRedirectToLogin}
                                    className="px-6 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors cursor-not-allowed"
                                >
                                    📷 登录即可上传赛事照片
                                </button>
                            </div>
                        )}

                        {records.length === 0 ? (
                            <p className="text-gray-600 text-center py-8">暂无图文记录</p>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {records.map((record) => (
                                    <div key={record.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow relative group">
                                        {isLoggedIn && (
                                            <button
                                                onClick={() => handleDeleteRecord(record.id)}
                                                className="absolute top-2 right-2 bg-white/90 text-red-500 hover:text-red-700 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                title="删除记录"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                        <img 
                                            src={record.image_url} 
                                            alt={record.caption || '赛事记录'}
                                            className="w-full h-48 object-cover"
                                        />
                                        {record.caption && (
                                            <div className="p-3">
                                                <p className="text-gray-700 text-sm">{record.caption}</p>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    {record.edited_by_username} · {new Date(record.updated_at).toLocaleString('zh-CN')}
                                                </p>
                                            </div>
                                        )}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
                <h2 className="text-2xl font-bold text-blue-900 mb-4">添加参赛队伍</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">队名 *</label>
                        <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="请输入队名"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">队长姓名 *</label>
                        <input
                            type="text"
                            value={captainName}
                            onChange={(e) => setCaptainName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="队员姓名"
                            />
                            <button
                                onClick={handleAddPlayer}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                添加
                            </button>
                        </div>
                        {players.length > 0 && (
                            <ul className="border border-gray-200 rounded-lg divide-y max-h-40 overflow-y-auto">
                                {players.map((player, idx) => (
                                    <li key={idx} className="px-4 py-2 flex justify-between items-center">
                                        <span className="text-gray-700">{player.name}</span>
                                        <button
                                            onClick={() => handleRemovePlayer(idx)}
                                            className="text-red-600 hover:text-red-800 text-sm font-medium"
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
                        className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        确认添加
                    </button>
                </div>
            </div>
        </div>
    );
}
