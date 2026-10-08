'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function GuestbookModal({ invitationId, onClose, onSuccess }) {
  const [author, setAuthor] = useState('');
  const [password, setPassword] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!author.trim()) return alert('성함을 입력해 주세요.');
    if (!password.trim()) return alert('비밀번호를 입력해 주세요.');
    if (!content.trim()) return alert('축하 메시지를 입력해 주세요.');

    setLoading(true);
    const { data, error } = await supabase.from('guestbook').insert([
      {
        invitation_id: invitationId,
        author: author.trim(),
        password: password.trim(),
        content: content.trim(),
      },
    ]).select();

    setLoading(false);
    if (error) {
      console.error('방명록 등록 오류:', error);
      alert('메시지 등록 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } else {
      alert('소중한 축하 메시지가 등록되었습니다. 감사합니다!');
      if (onSuccess && data && data[0]) {
        onSuccess(data[0]);
      }
      if (onClose) onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-[340px] rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 text-lg transition-colors"
          aria-label="닫기"
        >
          ✕
        </button>

        {/* 헤더 */}
        <div className="text-center pt-2 pb-5 border-b border-stone-100">
          <h3 className="text-base font-semibold text-stone-800 tracking-tight">
            축하 메시지 작성하기
          </h3>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
          
          {/* 작성자 */}
          <div>
            <label className="block text-[13px] font-medium text-stone-700 mb-1.5">
              작성자
            </label>
            <input
              type="text"
              required
              placeholder="성함"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3.5 py-3 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 text-xs focus:outline-none focus:border-stone-700 transition-colors"
            />
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-[13px] font-medium text-stone-700 mb-1.5">
              비밀번호
            </label>
            <input
              type="password"
              required
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-3 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 text-xs focus:outline-none focus:border-stone-700 transition-colors"
            />
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-[13px] font-medium text-stone-700 mb-1.5">
              내용
            </label>
            <textarea
              rows={4}
              required
              placeholder="내용 입력"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-3 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 text-xs focus:outline-none focus:border-stone-700 resize-none transition-colors"
            />
          </div>

          {/* 제출 버튼 */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#333333] hover:bg-[#1a1a1a] text-white rounded-xl text-sm font-medium tracking-wide transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? '등록 중...' : '작성 완료'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
