'use client';

import { useState, useMemo } from 'react';
import GuestPhotoUploadModal from './GuestPhotoUploadModal';

export default function GuestPhotoSnapSection({ 
  invitation, 
  isNightMode = false,
  className = ''
}) {
  const [showModal, setShowModal] = useState(false);

  // 신랑·신부가 제작/수정 시 해당 기능을 OFF했으면 렌더링 안 함 (기본값: true)
  const isEnabled = invitation?.template_config?.show_guest_photos !== false;

  // D-Day 판별 로직
  const isDDayOrAfter = useMemo(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('preview_today') === 'true' || params.get('today') === 'true' || params.get('preview_snap') === 'true') {
        return true;
      }
    }

    const weddingDateStr = invitation?.wedding_date;
    if (!weddingDateStr) return false;

    try {
      const normalized = typeof weddingDateStr === 'string' ? weddingDateStr.replace(' ', 'T') : '';
      const match = normalized.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (!match) return false;

      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);

      // 예식 당일 00:00:00 KST
      const weddingStartOfDay = new Date(year, month, day, 0, 0, 0, 0);
      return new Date() >= weddingStartOfDay;
    } catch {
      return false;
    }
  }, [invitation?.wedding_date]);

  if (!isEnabled || !invitation?.id) return null;

  return (
    <section id="guest-photo-snap" className={`py-12 sm:py-16 px-5 ${className}`}>
      <div className={`max-w-md mx-auto p-6 sm:p-7 rounded-3xl border transition-all text-center relative overflow-hidden shadow-2xs ${
        isNightMode
          ? 'bg-stone-900/90 border-stone-800 text-stone-200'
          : 'bg-[#FAF9F6] border-stone-200/90 text-stone-900'
      }`}>
        {/* 상단 장식 뱃지 */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider mb-3.5 border bg-white/80 border-stone-200/80 text-amber-800 shadow-2xs">
          <span>ATELIER SNAP</span>
          <span className="text-stone-300">|</span>
          <span>{isDDayOrAfter ? '신랑·신부 전용 보관함' : '예식 당일 오픈 🤍'}</span>
        </div>

        {/* 헤드라인 */}
        <h3 className={`text-base sm:text-lg font-bold tracking-tight mb-2 ${
          isNightMode ? 'text-white' : 'text-stone-900'
        }`}>
          {isDDayOrAfter
            ? '오늘 두 사람의 순간을 사진으로 선물해 주세요 📷'
            : '본식 당일, 두 사람의 순간을 담아주세요 📷'}
        </h3>

        {/* 설명 문구 */}
        <p className={`text-xs sm:text-[13px] leading-relaxed font-light mb-6 break-keep max-w-sm mx-auto ${
          isNightMode ? 'text-stone-400' : 'text-stone-600'
        }`}>
          {isDDayOrAfter
            ? '식장에서 직접 찍어주신 소중한 사진을 선물해 주세요. 보내주신 사진은 다른 하객에게 일체 공개되지 않고, 신랑·신부만의 비밀 보관함으로 전달됩니다.'
            : '결혼식 날 하객분들의 따뜻한 시선으로 담아주신 현장 사진을 선물해 주세요. 보내주신 사진은 다른 하객에게 공개되지 않고, 신랑·신부 둘만의 소중한 보관함으로 안전하게 전달됩니다.'}
        </p>

        {/* 액션 영역 */}
        {isDDayOrAfter ? (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className={`w-full py-3.5 px-6 rounded-2xl text-xs font-bold tracking-wide transition-all cursor-pointer shadow-sm active:scale-98 flex items-center justify-center gap-2 ${
              isNightMode
                ? 'bg-white hover:bg-stone-100 text-black shadow-md'
                : 'bg-stone-900 hover:bg-black text-white'
            }`}
          >
            <span>📷</span>
            <span>지금 사진 선물하기 (1회 최대 10장)</span>
          </button>
        ) : (
          <div className={`py-3 px-4 rounded-xl text-xs font-medium border inline-flex items-center gap-2 ${
            isNightMode
              ? 'bg-stone-800/60 border-stone-700/80 text-stone-300'
              : 'bg-stone-100/90 border-stone-200 text-stone-600'
          }`}>
            <span>✨</span>
            <span>예식 당일부터 이 청첩장에서 바로 사진을 올리실 수 있습니다</span>
          </div>
        )}
      </div>

      {/* 업로드 모달 레이어 */}
      {showModal && (
        <GuestPhotoUploadModal
          invitation={invitation}
          onClose={() => setShowModal(false)}
          onSuccess={() => {}}
        />
      )}
    </section>
  );
}
