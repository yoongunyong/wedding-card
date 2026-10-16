'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SceneGuestbookDeleteModal({ targetMsg, onClose, onDeleteSuccess }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!targetMsg) return null;

  const authorName = targetMsg.author || targetMsg.name || '방문자';

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg('비밀번호를 입력해 주세요.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // password와 id가 일치하는 방명록 삭제
      const { data, error } = await supabase
        .from('guestbook')
        .delete()
        .eq('id', targetMsg.id)
        .eq('password', password.trim())
        .select();

      if (error) {
        console.error('방명록 삭제 오류:', error);
        setErrorMsg('삭제 중 오류가 발생했습니다. 다시 시도해 주세요.');
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setErrorMsg('비밀번호가 일치하지 않습니다.');
        setLoading(false);
        return;
      }

      alert('축하 메시지가 삭제되었습니다.');
      if (onDeleteSuccess) onDeleteSuccess(targetMsg.id);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('삭제 처리 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[320px] rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-3.5 right-3.5 text-stone-400 hover:text-stone-700 p-1.5 transition-colors cursor-pointer"
          aria-label="닫기"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* 헤더 */}
        <div className="text-center pt-1 pb-3 border-b border-stone-100">
          <h3 className="text-sm font-semibold text-stone-900 tracking-tight">
            방명록 삭제
          </h3>
          <p className="text-[11px] text-stone-500 mt-1 font-light">
            작성 시 입력하셨던 비밀번호를 입력해 주세요.
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleDelete} className="space-y-4 pt-4 text-xs font-sans">
          <div>
            <div className="text-[11px] text-stone-500 mb-2.5 p-2.5 bg-stone-50 rounded-xl text-center break-keep">
              <span className="font-semibold text-stone-900">{authorName}</span> 님의 메시지를 삭제합니다.
            </div>
            <input
              type="password"
              required
              autoFocus
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 text-xs focus:outline-none focus:border-stone-900 transition-colors"
            />
            {errorMsg && (
              <p className="text-[11px] text-rose-500 mt-1.5 text-center font-medium">
                {errorMsg}
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-medium transition-colors cursor-pointer text-xs"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white rounded-xl font-medium transition-colors cursor-pointer text-xs"
            >
              {loading ? '삭제 중...' : '삭제하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
