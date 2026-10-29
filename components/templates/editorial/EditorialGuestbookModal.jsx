'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function EditorialGuestbookModal({ invitationId, onClose, onSuccess }) {
  const [author, setAuthor] = useState('');
  const [password, setPassword] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invitationId) {
      alert('실시간 미리보기 모드입니다.\n청첩장 제작 신청 완료 후 실제 발급된 링크에서 축하 메시지를 등록하실 수 있습니다.');
      if (onClose) onClose();
      return;
    }
    if (!author.trim()) return alert('작성자 성함을 입력해 주세요.');
    if (!password.trim()) return alert('비밀번호(삭제용)를 입력해 주세요.');
    if (!content.trim()) return alert('축하 메시지를 입력해 주세요.');

    setLoading(true);
    const { data, error } = await supabase
      .from('guestbook')
      .insert([
        {
          invitation_id: invitationId,
          author: author.trim(),
          password: password.trim(),
          content: content.trim(),
        },
      ])
      .select()
      .single();

    setLoading(false);
    if (error) {
      console.error('방명록 등록 오류:', error);
      alert('메시지 등록 중 오류가 발생했습니다.');
    } else {
      alert('따뜻한 축하의 메시지가 등록되었습니다. 감사합니다!');
      if (onSuccess && data) onSuccess(data);
      if (onClose) onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[390px] border border-stone-200 shadow-2xl relative p-7 sm:p-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-900 transition-colors cursor-pointer w-8 h-8 flex items-center justify-center text-xl font-light"
          aria-label="닫기"
        >
          ✕
        </button>

        {/* 헤더 */}
        <div className="text-center pb-6 border-b border-stone-200 mb-6">
          <span className="font-sans text-[10px] sm:text-[10.5px] tracking-[0.28em] uppercase text-stone-400 block mb-1 font-medium">
            GUESTBOOK INSCRIPTION
          </span>
          <h3 className="font-sans text-[22px] sm:text-[24px] text-stone-900 leading-tight font-normal">
            Leave a Message
          </h3>
          <p className="font-serif text-[12.5px] sm:text-[13px] text-stone-600 mt-1.5 leading-relaxed font-normal tracking-tight">
            두 사람의 새로운 여정에 따뜻한 한마디를 남겨주세요.
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="font-editorial-serif text-[11px] tracking-widest uppercase text-stone-400 block mb-1.5 font-semibold">
                NAME *
              </span>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="작성자 성함"
                className="w-full px-3 py-2.5 bg-white border border-stone-300 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 text-xs transition-colors"
              />
            </div>

            <div>
              <span className="font-editorial-serif text-[11px] tracking-widest uppercase text-stone-400 block mb-1.5 font-semibold">
                PASSWORD *
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="삭제용 비밀번호"
                className="w-full px-3 py-2.5 bg-white border border-stone-300 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 text-xs transition-colors"
              />
            </div>
          </div>

          <div>
            <span className="font-editorial-serif text-[11px] tracking-widest uppercase text-stone-400 block mb-1.5 font-semibold">
              MESSAGE *
            </span>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="따뜻한 축하의 메시지를 남겨주세요"
              className="w-full px-3.5 py-3 bg-white border border-stone-300 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 text-xs font-korean-serif leading-relaxed transition-colors resize-none"
            />
          </div>

          <div className="pt-3 border-t border-stone-200">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white text-[11px] uppercase tracking-[0.22em] font-sans font-medium rounded-full transition-colors cursor-pointer shadow-sm"
            >
              {loading ? 'Posting...' : 'Register Message · 축하글 남기기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
