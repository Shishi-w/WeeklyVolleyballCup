'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateUsername, changePassword, deactivateAccount } from '@/lib/actions/auth';

export default function AccountSettings({ user }: { user: { email: string; username: string | null } }) {
  const router = useRouter();
  const [username, setUsername] = useState(user.username ?? '');
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingName, setSavingName] = useState(false);

  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingPw, setSavingPw] = useState(false);

  const [deactMsg, setDeactMsg] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const handleSaveName = async () => {
    setSavingName(true);
    setNameMsg(null);
    try {
      const r = await updateUsername(username);
      if (!r.ok) {
        setNameMsg({ ok: false, text: r.error || '修改失败' });
        return;
      }
      setNameMsg({ ok: true, text: '用户名已更新' });
      router.refresh();
    } catch (e: any) {
      setNameMsg({ ok: false, text: e.message || '修改失败' });
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePw = async () => {
    if (newPw !== confirmPw) {
      setPwMsg({ ok: false, text: '两次输入的新密码不一致' });
      return;
    }
    if (newPw.length < 6) {
      setPwMsg({ ok: false, text: '新密码长度至少为 6 位' });
      return;
    }
    setSavingPw(true);
    setPwMsg(null);
    try {
      const r = await changePassword(curPw, newPw);
      if (!r.ok) {
        setPwMsg({ ok: false, text: r.error || '修改失败' });
        return;
      }
      window.location.href = '/auth/login?msg=' + encodeURIComponent('密码已修改，请用新密码重新登录');
    } catch (e: any) {
      setPwMsg({ ok: false, text: e.message || '修改失败' });
    } finally {
      setSavingPw(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm('确定要注销账号吗？')) return;
    setDeactivating(true);
    setDeactMsg(null);
    try {
      const r = await deactivateAccount();
      if (!r.ok) {
        setDeactMsg(r.error || '注销失败');
        return;
      }
      window.location.href = '/auth/login?msg=' + encodeURIComponent('账号已注销');
    } catch (e: any) {
      setDeactMsg(e.message || '注销失败');
    } finally {
      setDeactivating(false);
    }
  };

  const inputCls =
    'w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all outline-none text-black placeholder-gray-400';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-2';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 账号信息 */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-white/50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">账号信息</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>邮箱：{user.email}</p>
          <p>用户名：{username || '未设置'}</p>
        </div>
      </div>

      {/* 修改用户名 */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-white/50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">修改用户名</h3>
        {nameMsg && (
          <div
            className={`p-3 rounded-xl mb-4 text-sm border ${
              nameMsg.ok ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
            }`}
          >
            {nameMsg.text}
          </div>
        )}
        <label className={labelCls}>新用户名</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputCls}
          placeholder="球友们会看到这个名字"
        />
        <button
          onClick={handleSaveName}
          disabled={savingName}
          className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {savingName ? '保存中...' : '保存'}
        </button>
      </div>

      {/* 修改密码 */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-white/50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">修改密码</h3>
        {pwMsg && (
          <div
            className={`p-3 rounded-xl mb-4 text-sm border ${
              pwMsg.ok ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
            }`}
          >
            {pwMsg.text}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className={labelCls}>当前密码</label>
            <input
              type="password"
              value={curPw}
              onChange={(e) => setCurPw(e.target.value)}
              className={inputCls}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className={labelCls}>新密码</label>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className={inputCls}
              placeholder="至少 6 位"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className={labelCls}>确认新密码</label>
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              className={inputCls}
              autoComplete="new-password"
            />
          </div>
        </div>
        <button
          onClick={handleChangePw}
          disabled={savingPw}
          className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {savingPw ? '提交中...' : '修改密码'}
        </button>
      </div>

      {/* 注销账号 */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-red-100">
        <h3 className="text-lg font-semibold text-red-600 mb-2">注销账号</h3>
        <p className="text-sm text-gray-500 mb-4">注销后该账号将无法登录。</p>
        {deactMsg && (
          <div className="p-3 rounded-xl mb-4 text-sm border bg-red-50 text-red-600 border-red-100">{deactMsg}</div>
        )}
        <button
          onClick={handleDeactivate}
          disabled={deactivating}
          className="px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {deactivating ? '处理中...' : '注销账号'}
        </button>
      </div>
    </div>
  );
}
