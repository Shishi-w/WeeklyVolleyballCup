'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';

type Announcement = {
  id: string;
  title: string;
  content: string;
  position_x: number;
  position_y: number;
  rotation: number;
  color: string;
  pattern: string;
  created_at: string;
  updated_at: string;
  edited_by: string | null;
};

const COLORS = ['white', 'gray', 'blue', 'green', 'purple'];

const COLOR_STYLES: Record<string, string> = {
  white: 'bg-white border-gray-200',
  gray: 'bg-gray-50 border-gray-300',
  blue: 'bg-blue-50 border-blue-200',
  green: 'bg-green-50 border-green-200',
  purple: 'bg-purple-50 border-purple-200'
};

const PATTERNS = [
  { id: 'none', name: '无图案', emoji: '' },
  { id: 'dots', name: '圆点', emoji: '●' },
  { id: 'lines', name: '线条', emoji: '━' },
  { id: 'grid', name: '网格', emoji: '▦' },
  { id: 'waves', name: '波浪', emoji: '～' }
];

const PATTERN_STYLES: Record<string, string> = {
  none: '',
  dots: 'bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,.15)_1px,transparent_0)] bg-[length:20px_20px]',
  lines: 'bg-[linear-gradient(90deg,transparent_49%,rgba(0,0,0,.1)_50%,transparent_51%)] bg-[length:30px_30px]',
  grid: 'bg-[linear-gradient(rgba(0,0,0,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.1)_1px,transparent_1px)] bg-[length:20px_20px]',
  waves: 'bg-[url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")]'
};

interface AnnouncementBoardProps {
  isLoggedIn: boolean;
}

export default function AnnouncementBoard({ isLoggedIn }: AnnouncementBoardProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('获取公告失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAnnouncement = async (announcement: Partial<Announcement>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (editingId) {
        const { error } = await supabase
          .from('announcements')
          .update({
            ...announcement,
            edited_by: user?.user_metadata?.username || user?.email || 'Anonymous',
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);

        if (error) throw error;
        setEditingId(null);
        setShowAddModal(false);
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert([{
            ...announcement,
            edited_by: user?.user_metadata?.username || user?.email || 'Anonymous'
          }]);

        if (error) throw error;
        setShowAddModal(false);
      }

      fetchAnnouncements();
    } catch (error) {
      console.error('保存公告失败:', error);
      alert('保存失败，请重试');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('确定要删除这条公告吗？')) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAnnouncements();
    } catch (error) {
      console.error('删除公告失败:', error);
      alert('删除失败，请重试');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* 简约标题区域 */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">公告栏</h2>
        <p className="text-gray-600">赛事信息与重要通知（或者乱七八糟其他的什么都行）</p>
      </div>

      {/* 公告列表 */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无公告</h3>
            <p className="text-gray-500 mb-6">当前没有发布的公告信息</p>
            {isLoggedIn && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 transition-colors"
              >
                添加公告
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`group relative p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${COLOR_STYLES[announcement.color] || COLOR_STYLES.white} ${PATTERN_STYLES[announcement.pattern] || ''}`}
                style={{
                  transform: `rotate(${announcement.rotation}deg)`
                }}
                onClick={() => setSelectedAnnouncement(announcement)}
              >
                {/* 编辑和删除按钮 */}
                {isLoggedIn && (
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(announcement.id);
                        setShowAddModal(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="编辑"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAnnouncement(announcement.id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="删除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* 标题 */}
                <h3 className="text-lg font-semibold text-gray-900 mb-3 pr-16">
                  {announcement.title}
                </h3>

                {/* 内容预览 */}
                <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                  {announcement.content}
                </p>

                {/* 底部信息 */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                  <span className="text-xs text-gray-500">
                    {new Date(announcement.updated_at).toLocaleDateString('zh-CN')}
                  </span>
                  {announcement.edited_by && (
                    <span className="text-xs text-gray-500">
                      {announcement.edited_by}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 添加按钮 */}
      {isLoggedIn && announcements.length > 0 && (
        <div className="text-center mt-8">
          <button
            onClick={() => {
              setEditingId(null);
              setShowAddModal(true);
            }}
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加新公告
          </button>
        </div>
      )}

      {/* 添加/编辑公告弹窗 */}
      {showAddModal && (
        <AnnouncementEditor
          announcement={editingId ? announcements.find(a => a.id === editingId) || null : null}
          onClose={() => {
            setShowAddModal(false);
            setEditingId(null);
          }}
          onSave={handleSaveAnnouncement}
        />
      )}

      {/* 查看详情弹窗 */}
      {selectedAnnouncement && (
        <AnnouncementDetail
          announcement={selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
        />
      )}
    </div>
  );
}

// 编辑公告弹窗组件
function AnnouncementEditor({
  announcement,
  onClose,
  onSave
}: {
  announcement: Announcement | null;
  onClose: () => void;
  onSave: (announcement: Partial<Announcement>) => void;
}) {
  const [title, setTitle] = useState(announcement?.title || '');
  const [content, setContent] = useState(announcement?.content || '');
  const [color, setColor] = useState(announcement?.color || 'white');
  const [pattern, setPattern] = useState(announcement?.pattern || 'none');
  const [rotation, setRotation] = useState(announcement?.rotation || 0);

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      alert('请填写标题和内容');
      return;
    }

    onSave({
      title,
      content,
      color,
      pattern,
      rotation,
      position_x: announcement?.position_x || 0,
      position_y: announcement?.position_y || 0
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {announcement ? '编辑公告' : '添加公告'}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标题 *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none"
                placeholder="请输入公告标题"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                内容 *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none resize-none"
                rows={4}
                placeholder="请输入公告内容"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                背景颜色
              </label>
              <div className="grid grid-cols-5 gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-8 rounded border-2 transition-all ${
                      COLOR_STYLES[c] || COLOR_STYLES.white
                    } ${
                      color === c ? 'border-gray-900 ring-2 ring-gray-300' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                背景图案
              </label>
              <div className="grid grid-cols-5 gap-2">
                {PATTERNS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPattern(p.id)}
                    className={`h-8 rounded border-2 transition-all bg-white ${
                      PATTERN_STYLES[p.id] || ''
                    } ${
                      pattern === p.id ? 'border-gray-900 ring-2 ring-gray-300' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                旋转角度: {rotation}°
              </label>
              <input
                type="range"
                min="-5"
                max="5"
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 查看详情弹窗组件
function AnnouncementDetail({
  announcement,
  onClose
}: {
  announcement: Announcement;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900 pr-8">
              {announcement.title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className={`p-4 rounded-lg border-2 mb-4 ${COLOR_STYLES[announcement.color] || COLOR_STYLES.white} ${PATTERN_STYLES[announcement.pattern] || ''}`}>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {announcement.content}
            </p>
          </div>

          <div className="text-sm text-gray-500 space-y-1">
            <p>发布日期: {new Date(announcement.created_at).toLocaleString('zh-CN')}</p>
            <p>最后更新: {new Date(announcement.updated_at).toLocaleString('zh-CN')}</p>
            {announcement.edited_by && (
              <p>编辑者: {announcement.edited_by}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
