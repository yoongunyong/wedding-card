'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function EditorialGuestbookDeleteModal({ targetMsg, onClose, onDeleteSuccess }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 모달 마운트 시 배경 스크롤 잠금
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!password.trim()) return alert('비밀번호를 입력해 주세요.');

    setLoading(true);
    const trimmedPw = password.trim();

    // targetMsg에 password가 클라이언트에 있고 불일치하면 즉시 방어
    if (targetMsg.password && targetMsg.password !== trimmedPw) {
      setLoading(false);
      return alert('비밀번호가 일치하지 않습니다.');
    }

    // DB 차원에서 password 일치 여부 검증 및 삭제
    const { data, error } = await supabase
      .from('guestbook')
      .delete()
      .eq('id', targetMsg.id)
      .eq('password', trimmedPw)
      .select();

    if (!error && (!data || data.length === 0)) {
      setLoading(false);
      return alert('비밀번호가 일치하지 않습니다.');
    }

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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[320px] rounded-[20px] shadow-2xl relative pt-[28px] pb-[24px] px-[20px] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#3C3A3A] hover:text-black transition-colors cursor-pointer w-8 h-8 flex items-center justify-center"
          aria-label="닫기"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M1.5 1.5L14.5 14.5M14.5 1.5L1.5 14.5" stroke="#3C3A3A" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        {/* 헤더 */}
        <div className="text-center mb-[18px]">
          <h3 className="font-nanumsquare font-normal text-[16px] text-[#333333] leading-none">
            메시지 삭제
          </h3>
          <p className="font-nanumsquare text-[11.5px] text-[#777777] mt-[10px] leading-relaxed">
            작성 시 입력했던 비밀번호를 입력해 주세요.
          </p>
        </div>

        <form onSubmit={handleDelete} className="space-y-[14px]">
          <input
            type="password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 입력"
            style={{ boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.08)' }}
            className="w-full h-[46px] px-4 bg-white border border-[#DAD1D1] rounded-[11.5px] text-[#333333] placeholder:text-[#B5B5B5] font-nanumsquare text-[13px] text-center focus:outline-none focus:border-[#393939] transition-colors"
          />

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-[42px] border border-[#DAD1D1] text-[#666666] hover:bg-stone-50 font-nanumsquare text-[13px] rounded-[11.5px] transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-[42px] bg-[#393939] hover:bg-[#2c2c2c] disabled:bg-[#888888] text-[#F6F6F6] font-nanumsquare font-bold text-[13px] rounded-[11.5px] transition-colors cursor-pointer"
            >
              {loading ? '삭제 중...' : '삭제'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
