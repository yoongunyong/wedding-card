'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function EditorialGuestbookModal({ invitationId, onClose, onSuccess }) {
  const [author, setAuthor] = useState('');
  const [password, setPassword] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  // 모달 마운트 시 배경 스크롤 잠금 (브라우저 퀵스크롤 및 배경 밀림 완전 차단)
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* 모달 컨테이너 (Figma 1:1 시각적 매칭: 너비 340px, 좌우 패딩 px-[20px], 배경 #FCFCFC) */}
      <div
        className="bg-[#FCFCFC] w-full max-w-[340px] rounded-[14.5px] shadow-2xl relative pt-[36px] pb-[30px] px-[20px] sm:px-[24px] animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 (X표시, Figma color: #3C3A3A, top-5 right-5) */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 text-[#3C3A3A] hover:text-black transition-colors cursor-pointer w-8 h-8 flex items-center justify-center z-10"
          aria-label="닫기"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M1.5 1.5L14.5 14.5M14.5 1.5L1.5 14.5" stroke="#3C3A3A" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        {/* 헤더 */}
        <div className="text-center">
          {/* 축하 메시지 작성하기 (Figma: NanumSquare Neo 34px -> 1x 17px, #292929) */}
          <h3 className="font-nanumsquare font-normal text-[17px] text-[#292929] leading-none text-center tracking-tight">
            축하 메시지 작성하기
          </h3>

          {/* 헤더 구분선 (Figma: width 546px -> 1x 273px, border: 1px solid #D3D3D3) */}
          <div 
            style={{ borderTop: '1px solid #D3D3D3' }} 
            className="w-full max-w-[273px] mx-auto mt-[18px] mb-[24px]" 
          />
        </div>

        {/* 폼 본문 */}
        <form onSubmit={handleSubmit} className="space-y-[18px] text-left">
          {/* 1. 작성자 (Figma: NanumSquare Neo 30px -> 1x 15px, #333333 font-normal, 인풋 h-[52px], rounded-[11.5px]) */}
          <div>
            <label className="font-nanumsquare font-normal text-[15px] text-[#333333] leading-none mb-[8px] block">
              작성자
            </label>
            <input
              type="text"
              required
              maxLength={30}
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="성함"
              style={{ boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.08)' }}
              className="w-full h-[52px] px-4 bg-white border border-[#DAD1D1] rounded-[11.5px] text-[#333333] placeholder:text-[#B8B8B8] font-nanumsquare text-[13px] focus:outline-none focus:border-[#393939] transition-colors"
            />
          </div>

          {/* 2. 비밀번호 */}
          <div>
            <label className="font-nanumsquare font-normal text-[15px] text-[#333333] leading-none mb-[8px] block">
              비밀번호
            </label>
            <input
              type="password"
              required
              maxLength={20}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              style={{ boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.08)' }}
              className="w-full h-[52px] px-4 bg-white border border-[#DAD1D1] rounded-[11.5px] text-[#333333] placeholder:text-[#B8B8B8] font-nanumsquare text-[13px] focus:outline-none focus:border-[#393939] transition-colors"
            />
          </div>

          {/* 3. 내용 */}
          <div>
            <label className="font-nanumsquare font-normal text-[15px] text-[#333333] leading-none mb-[8px] block">
              내용
            </label>
            <textarea
              required
              rows={5}
              maxLength={300}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용 입력 (최대 300자)"
              style={{ boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.08)' }}
              className="w-full h-[160px] p-4 bg-white border border-[#DAD1D1] rounded-[11.5px] text-[#333333] placeholder:text-[#B8B8B8] font-nanumsquare text-[13px] leading-relaxed focus:outline-none focus:border-[#393939] transition-colors resize-none"
            />
          </div>

          {/* 4. 작성 완료 버튼 (Figma: h-[50px], bg #393939, rounded-[11.5px], 텍스트 NanumSquare Neo 700 15px #FFFFFF) */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[50px] bg-[#393939] hover:bg-[#2c2c2c] active:scale-[0.99] disabled:opacity-70 text-white font-nanumsquare font-bold text-[15px] rounded-[11.5px] transition-all cursor-pointer shadow-sm flex items-center justify-center select-none"
            >
              {loading ? '등록 중...' : '작성 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
