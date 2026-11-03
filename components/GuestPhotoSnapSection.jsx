'use client';

import { useState, useMemo } from 'react';
import ScrollReveal from './ScrollReveal';
import GuestPhotoUploadModal from './GuestPhotoUploadModal';

export default function GuestPhotoSnapSection({ 
  invitation, 
  isNightMode = false,
  className = ''
}) {
  const [showModal, setShowModal] = useState(false);

  // 신랑·신부가 제작/수정 시 해당 기능을 OFF했으면 렌더링 안 함 (기본값: true)
  const isEnabled = invitation?.template_config?.show_guest_photos !== false;

  // 샘플 프리뷰 모드 판별
  const isSample = Boolean(
    invitation?.is_sample_preview || 
    ['basic', 'editorial', 'playlist', 'cinematic', 'scene'].includes(invitation?.slug)
  );

  // 사진 공유 전용 대표 사진 (방안 B: images.photo_sharing 최우선, 미등록 시 빈값 -> 카메라 플레이스홀더)
  const images = invitation?.images || {};
  const extra = { ...(invitation?.template_config || {}), ...(invitation?.extra_data || {}) };
  const photoSharingImage = images.photo_sharing || images.snap_photo || extra.photo_sharing_image || '';

  // D-Day 판별 로직
  const isDDayOrAfter = useMemo(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('preview_today') === 'true' || params.get('today') === 'true' || params.get('preview_snap') === 'true') {
        return true;
      }
    }

    // 샘플 미리보기인 경우 관리자 및 사용자가 바로 업로드 모달을 체험해볼 수 있도록 허용
    if (isSample) return true;

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
  }, [invitation?.wedding_date, isSample]);

  if (!isEnabled || (!invitation?.id && !invitation?.slug)) return null;

  return (
    <section
      id="guest-photo-snap"
      className={`py-20 sm:py-24 px-6 text-center border-t transition-colors ${
        isNightMode
          ? 'bg-[#121212] border-white/10 text-stone-200'
          : 'bg-[#FCFBF7] border-stone-200/70 text-stone-900'
      } ${className}`}
    >
      <ScrollReveal>
        {/* 영문 헤더: Photo Sharing (Cormorant 30px sm:34px) */}
        <h2 className={`font-cormorant font-normal text-[30px] sm:text-[34px] tracking-normal leading-none ${
          isNightMode ? 'text-white' : 'text-stone-900'
        }`}>
          Photo Sharing
        </h2>

        {/* 한글 서브헤더: 사진 공유 (Noto Serif KR 18px sm:19px) */}
        <p className={`font-serif text-[18px] sm:text-[19px] font-normal tracking-normal mt-3.5 sm:mt-4 mb-3.5 ${
          isNightMode ? 'text-stone-200' : 'text-stone-800'
        }`}>
          사진 공유
        </p>

        {/* 감성 안내 문구 (13.5px leading-relaxed) */}
        <p className={`text-[13px] sm:text-[14px] font-sans leading-relaxed mb-8 sm:mb-10 whitespace-pre-line max-w-[340px] mx-auto ${
          isNightMode ? 'text-stone-400' : 'text-[#707070]'
        }`}>
          저희의 소중한 순간을 함께 담아주세요.
          {'\n'}
          여러분의 시선으로 기록된 특별한 순간들을
          {'\n'}
          오래도록 간직하고 싶습니다.
        </p>
      </ScrollReveal>

      <ScrollReveal delay={120}>
        {/* 폴라로이드 감성 포토 프레임 (Figma Rectangle 6232: 318x385 / 2x -> 159x192.5px 1x) */}
        <div className={`inline-block p-3 pb-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] border ${
          isNightMode
            ? 'bg-[#1C1C1E] border-stone-700/60 shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
            : 'bg-white border-[#EBEBEB]'
        }`}>
          <div className={`w-[155px] h-[155px] sm:w-[170px] sm:h-[170px] rounded-lg overflow-hidden flex items-center justify-center ${
            isNightMode ? 'bg-stone-800' : 'bg-[#F5F5F3]'
          }`}>
            {photoSharingImage ? (
              <img
                src={photoSharingImage}
                alt="사진 공유 포토 프레임"
                className="w-full h-full object-cover select-none"
              />
            ) : (
              <div className={`flex flex-col items-center justify-center gap-1.5 p-4 ${
                isNightMode ? 'text-stone-500' : 'text-stone-400'
              }`}>
                <svg className="w-8 h-8 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
                <span className="text-[11px] font-sans">Photo Snap</span>
              </div>
            )}
          </div>
        </div>

        {/* 예식 당일 안내 문구 (Figma 2832:2508) */}
        <p className={`text-[13px] sm:text-[14px] font-sans mt-5 sm:mt-6 mb-4 sm:mb-5 font-normal ${
          isNightMode ? 'text-stone-400' : 'text-stone-600'
        }`}>
          예식 당일 부터 업로드 가능합니다.
        </p>

        {/* 사진 업로드하기 버튼 (Figma Rectangle 6233: 329x78 / 2x -> 165x39px) */}
        <div>
          <button
            type="button"
            onClick={() => {
              if (isDDayOrAfter) {
                setShowModal(true);
              } else {
                alert('예식 당일부터 사진을 등록하실 수 있습니다 🤍');
              }
            }}
            className={`inline-flex items-center justify-center w-[165px] h-[40px] text-[13.5px] sm:text-[14px] font-sans font-medium rounded-xl transition-colors shadow-xs cursor-pointer select-none ${
              isNightMode
                ? 'bg-white hover:bg-stone-200 text-stone-900'
                : 'bg-[#333333] hover:bg-[#222222] text-white'
            }`}
          >
            사진 업로드하기
          </button>
        </div>
      </ScrollReveal>

      {/* 업로드 모달 레이어 */}
      {showModal && (
        <GuestPhotoUploadModal
          invitation={invitation}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            alert('소중한 사진이 성공적으로 전달되었습니다! 감사합니다 🤍');
          }}
        />
      )}
    </section>
  );
}
