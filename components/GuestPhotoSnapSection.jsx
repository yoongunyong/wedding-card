'use client';

import { useState, useMemo } from 'react';
import ScrollReveal from './ScrollReveal';
import GuestPhotoUploadModal from './GuestPhotoUploadModal';

export default function GuestPhotoSnapSection({ 
  invitation, 
  isNightMode = false,
  isEditorial = false,
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

  // 에디토리얼 모드 판별 (명시적 prop 또는 template_id/slug 감지)
  const isEditorialMode = Boolean(
    isEditorial || 
    invitation?.template_id === 'editorial' || 
    invitation?.slug === 'editorial'
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

  // 1. 에디토리얼(시안 2) 피그마 실측 1:1 정밀 렌더링
  if (isEditorialMode) {
    const displayImage = photoSharingImage || images.couple_profile || images.couple || extra.couple_profile_image || (isSample ? '/samples/couple-profile-01.jpg' : (images.main || images.cover || invitation?.main_image || ''));

    return (
      <section
        id="guest-photo-snap"
        className={`w-full bg-[#FEFEFE] pt-[65.5px] pb-0 text-center select-none overflow-hidden ${className}`}
      >
        <ScrollReveal>
          {/* 상단 1: Photo Sharing 영문 필기체 (Figma: Weddingday Personal Use 70px -> 1x 35px, #292929, leading-[72%]) */}
          <h2 className="font-weddingday text-[35px] text-[#292929] leading-[72%] text-center select-none tracking-normal">
            Photo Sharing
          </h2>

          {/* 상단 2: 사진 공유 (Figma: NanumSquare Neo OTF 36px -> 1x 18px, #292929, mt-[34.5px]) */}
          <p className="font-nanumsquare font-normal text-[18px] text-[#292929] leading-none text-center mt-[34.5px] tracking-tight">
            사진 공유
          </p>

          {/* 상단 3: 감성 안내 문구 (Figma: NanumSquare Neo OTF 28px -> 1x 14px, #333333, leading-[1.74], mt-[43px]) */}
          <p className="font-nanumsquare font-normal text-[14px] text-[#333333] leading-[1.74] text-center mt-[43px] tracking-tight whitespace-pre-line max-w-[280px] mx-auto">
            저희의 소중한 순간을 함께 담아주세요.{'\n'}
            여러분의 시선으로 기록된 특별한 순간들을{'\n'}
            오래도록 간직하고 싶습니다.
          </p>

          {/* 중앙: 폴라로이드 액자 카드 (Figma: 318x385 -> 1x 159x192.5px, bg #FEFEFE, shadow, mt-[22.5px]) */}
          <div className="mt-[22.5px] flex items-center justify-center">
            <div
              style={{
                boxShadow: '0px 2.7px 5.1px rgba(0, 0, 0, 0.35)',
              }}
              className="w-[159px] bg-[#FEFEFE] pt-[8.6px] px-[8.6px] pb-[10px] flex flex-col items-center select-none"
            >
              {/* 폴라로이드 내부 상단 이미지 (Figma: 283.5x288.46 -> 1x 141.75x144.23px) */}
              <div className="w-[141.75px] h-[144.23px] bg-stone-100 overflow-hidden flex items-center justify-center">
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt="Photo Sharing Frame"
                    className="w-full h-full object-cover select-none"
                    onError={(e) => {
                      if (isSample && e.currentTarget.src !== '/samples/couple-profile-01.jpg') {
                        e.currentTarget.src = '/samples/couple-profile-01.jpg';
                      }
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-stone-400 gap-1">
                    <svg className="w-6 h-6 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                    </svg>
                    <span className="text-[10px] font-sans">Photo Snap</span>
                  </div>
                )}
              </div>

              {/* 폴라로이드 내부 하단 문구: 예식 당일 부터 업로드 가능합니다. (Figma: 18px -> 1x 9px, #999999, mt-[8px]) */}
              <p className="font-nanumsquare font-normal text-[9px] text-[#999999] leading-none text-center mt-[8px]">
                예식 당일 부터 업로드 가능합니다.
              </p>
            </div>
          </div>

          {/* 하단 버튼: 사진 업로드하기 (Figma: 329x78 -> 1x 164.5x39px, bg #393939, rounded-full, mt-[26.5px]) */}
          <div className="mt-[26.5px] flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                if (isDDayOrAfter) {
                  setShowModal(true);
                } else {
                  alert('예식 당일부터 사진을 등록하실 수 있습니다 🤍');
                }
              }}
              style={{
                boxShadow: '0px 4px 14.2px rgba(0, 0, 0, 0.09)',
              }}
              className="w-[164.5px] h-[39px] bg-[#393939] hover:bg-[#2c2c2c] active:scale-[0.98] rounded-full flex items-center justify-center transition-all cursor-pointer select-none"
            >
              <span className="font-nanumsquare font-bold text-[14px] text-[#F3F3F3] leading-none tracking-tight">
                사진 업로드하기
              </span>
            </button>
          </div>

          {/* 사진 공유 섹션 바닥 공통 구분선 (인수인계서 필수 원칙: w-[280.5px], borderTop: 0.5px solid #999999) */}
          <div 
            style={{ borderTop: '0.5px solid #999999' }}
            className="w-[280.5px] max-w-[75%] mt-[70px] mb-[50px] mx-auto shrink-0" 
          />
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

  // 2. 기본형 템플릿 (Basic, Playlist, Cinematic, Scene) 렌더링 유지
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
