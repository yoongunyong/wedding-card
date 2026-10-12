'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function EditorialGuestbookDeleteModal({ targetMsg, onClose, onDeleteSuccess }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!password.trim()) return alert('비밀번호를 입력해 주세요.');

    if (targetMsg.password !== password.trim()) {
      return alert('비밀번호가 일치하지 않습니다.');
    }

    setLoading(true);
    const { error } = await supabase
      .from('guestbook')
      .delete()
      .eq('id', targetMsg.id);

    setLoading(false);
    if (error) {
      console.error('방명록 삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    } else {
      alert('메시지가 삭제되었습니다.');
      if (onDeleteSuccess) onDeleteSuccess(targetMsg.id);
      if (onClose) onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[340px] border border-stone-200 shadow-2xl relative p-7 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-900 transition-colors cursor-pointer w-8 h-8 flex items-center justify-center text-xl font-light"
          aria-label="닫기"
        >
          ✕
        </button>

        <div className="text-center pb-5 border-b border-stone-200 mb-5">
          <span className="font-editorial-serif text-[11px] tracking-[0.3em] uppercase text-stone-400 block mb-1 font-semibold">
            DELETE MESSAGE
          </span>
          <h3 className="font-editorial-title text-[24px] text-stone-900 leading-tight">
            Confirm Password
          </h3>
          <p className="font-korean-serif text-xs text-stone-600 mt-1">
            작성 시 입력했던 비밀번호를 입력해 주세요.
          </p>
        </div>

        <form onSubmit={handleDelete} className="space-y-4">
          <input
            type="password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            className="w-full px-3.5 py-2.5 bg-white border border-stone-300 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 text-xs transition-colors"
          />

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 border border-stone-300 text-stone-600 hover:border-stone-900 text-xs font-editorial-serif uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white text-xs font-editorial-serif uppercase tracking-wider transition-colors cursor-pointer"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
