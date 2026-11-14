'use client';

import { useState, useEffect, useMemo } from 'react';

/**
 * CinematicIntro (시안 4 시네마틱 모노리스 커버 화면)
 * 
 * [피그마 CSS 스펙 1:1 정밀 구현]:
 * - 캔버스: width 780px, height 1386px (2x 기준) -> 1x 390px * 693px
 * - 라이트 모드 / 다크 모드(Midnight) 완벽 대응
 *   - 라이트 모드: background #FFFFFF, 텍스트 #292929, #333333
 *   - 다크 모드: background #1C1C1C, 텍스트 #FFFFFF, #B5B5B5
 * - The marriage of: 'Weddingday Personal Use' font, 65px -> 1x 32.5px
 * - 신랑 & 신부 영문명: 'Cormorant Garamond' 500, 48px -> 1x 24px
 * - 커버 이미지: width 524px, height 484px -> 1x 262px, 242px (aspect-[524/484]), grayscale contrast-105
 * - 날짜: 'Cormorant Garamond' 48px -> 1x 24px, letter-spacing 0.04em (예: 2027.May 15. 14:00 pm)
 * - 장소: 'Spoqa Han Sans Neo' 300, 28px -> 1x 14px (예: 반얀트리 클럽 앤 스파 서울)
 * - 하단 문구: 'Cormorant Garamond' 34px -> 1x 17px (Welcome to our Wedding Day)
 * - 어디든 화면 터치 시 부드러운 페이드아웃 애니메이션과 함께 본문 진입
 */
export default function CinematicIntro({
  invitation,
  onOpen,
  isInModal: propIsInModal,
  isNightMode,
  setIsNightMode,
}) {
  const [transitionStep, setTransitionStep] = useState('idle'); // 'idle' | 'darkening' | 'revealing'
  const isInModal = Boolean(propIsInModal ?? invitation?.is_modal_preview);
  const isSample = Boolean(invitation?.is_sample_preview || invitation?.slug === 'cinematic');

  const config = invitation?.template_config || {};
  const images = invitation?.images || {};
  const extra = invitation?.extra_data || {};

  // 1. 커버 이미지 (고객 등록 사진 최우선, 미등록 시 main 또는 샘플)
  const coverImage =
    images.cover ||
    invitation?.cover_image ||
    extra.cover_image ||
    images.main ||
    invitation?.main_image ||
    images.couple_profile ||
    (isSample ? '/samples/cinematic-cover.jpg' : '');

  // 2. 신랑 & 신부 영문명 동적 조합 (피그마 예: JANG MIN KI & KWON KI-DEUK)
  const displayNamesEn = useMemo(() => {
    const groomEn = (
      invitation?.groom_name_en ||
      [invitation?.groom_last_name_en, invitation?.groom_first_name_en].filter(Boolean).join(' ') ||
      invitation?.groom_first_name_en ||
      ''
    ).trim();

    const brideEn = (
      invitation?.bride_name_en ||
      [invitation?.bride_last_name_en, invitation?.bride_first_name_en].filter(Boolean).join(' ') ||
      invitation?.bride_first_name_en ||
      ''
    ).trim();

    if (groomEn && brideEn) {
      return `${groomEn.toUpperCase()} & ${brideEn.toUpperCase()}`;
    }
    if (invitation?.main_names_en) {
      return invitation.main_names_en.toUpperCase();
    }
    if (groomEn || brideEn) {
      return (groomEn || brideEn).toUpperCase();
    }
    if (invitation?.groom_name && invitation?.bride_name) {
      return `${invitation.groom_name} & ${invitation.bride_name}`;
    }
    if (isSample) {
      return 'JANG MIN KI & KWON KI-DEUK';
    }
    return '';
  }, [invitation, isSample]);

  // 3. 날짜 & 시간 동적 포맷팅 (피그마 예: 2027.May 15. 14:00 pm)
  const weddingDateStr = invitation?.wedding_date || (isSample ? '2027-05-15 14:00:00' : '');
  const formattedDate = useMemo(() => {
    if (!weddingDateStr) {
      return isSample ? '2027.May 15. 14:00 pm' : '';
    }
    const normalized = typeof weddingDateStr === 'string'
      ? weddingDateStr.replace(' ', 'T')
      : weddingDateStr;
    const d = new Date(normalized);
    if (isNaN(d.getTime())) {
      return isSample ? '2027.May 15. 14:00 pm' : '';
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const y = d.getFullYear();
    const m = months[d.getMonth()];
    const day = d.getDate();
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const period = hours < 12 ? 'am' : 'pm';
    const hourStr = String(hours).padStart(2, '0');

    return `${y}.${m} ${day}. ${hourStr}:${minutes} ${period}`;
  }, [weddingDateStr, isSample]);

  // 4. 예식장 장소 (피그마 예: 반얀트리 클럽 앤 스파 서울)
  const venueText = useMemo(() => {
    const hall = invitation?.template_config?.venue_hall || invitation?.venue_hall;
    const parts = [invitation?.venue_name, hall].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
    return isSample ? '반얀트리 클럽 앤 스파 서울' : '';
  }, [invitation?.venue_name, invitation?.template_config?.venue_hall, invitation?.venue_hall, isSample]);

  // 5. 스크롤 락 및 복원
  useEffect(() => {
    const isInsideModal = isInModal || (typeof document !== 'undefined' && Boolean(document.getElementById('preview-scroll-container')));
    if (isInsideModal) return;

    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      window.scrollTo(0, 0);
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }

    return () => {
      if (typeof window !== 'undefined' && !isInsideModal) {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        if ('scrollRestoration' in window.history) {
          window.history.scrollRestoration = 'auto';
        }
      }
    };
  }, [isInModal]);

  // 6. 어디든 클릭/터치 시 시네마틱 암전(Blink) 본문 진입 & BGM 자동 재생 시작 (시안 1, 2, 3과 동일)
  const handleOpen = () => {
    if (transitionStep !== 'idle') return;

    if (typeof document !== 'undefined' && document.activeElement) {
      document.activeElement.blur();
    }

    // BGM 재생 이벤트 발생 (하객의 첫 인터랙션 시 자동 재생 정책 충족)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('play-wedding-bgm'));
    }

    // 1단계: 화면이 서서히 어두워짐 (800ms)
    setTransitionStep('darkening');

    // 2단계: 화면이 완전히 어두워진 시점(850ms) 후 본문 드러내기 시작
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        window.focus();
      }
      setTransitionStep('revealing');

      // 3단계: 어둠이 안개처럼 걷힌 후 인트로 언마운트
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';
          window.scrollTo(0, 0);
        }
        if (typeof document !== 'undefined') {
          const previewContainer = document.getElementById('preview-scroll-container');
          if (previewContainer) {
            previewContainer.scrollTop = 0;
          }
        }
        if (onOpen) onOpen();
      }, 1250);
    }, 850);
  };

  return (
    <>
      <div
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleOpen();
          }
        }}
        className={`${
          isInModal
            ? 'absolute inset-0 z-20'
            : 'fixed inset-0 z-50'
        } w-full h-full overflow-y-auto overflow-x-hidden flex flex-col items-center justify-between cursor-pointer select-none ${
          transitionStep === 'revealing'
            ? 'hidden pointer-events-none'
            : transitionStep === 'darkening'
            ? 'opacity-100 pointer-events-none'
            : 'opacity-100'
        } ${
          isNightMode ? 'bg-[#1C1C1C] text-stone-100' : 'bg-white text-stone-900'
        }`}
        style={{
          WebkitTapHighlightColor: 'transparent',
        }}
      >
      {/* 테마 스위처 (우측 상단 또는 좌측 상단 - 커버에서도 전환 가능, 클릭 시 버블링 방지) */}
      {setIsNightMode && (
        <div
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1.25rem)' }}
          className="absolute left-5 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`flex items-center p-0.5 rounded-full border shadow-xs backdrop-blur-md transition-all ${
              isNightMode ? 'bg-stone-900/90 border-stone-800' : 'bg-white/95 border-stone-200'
            }`}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsNightMode(false);
              }}
              className={`px-3 py-1 rounded-full text-[10px] font-sans tracking-wide transition-all cursor-pointer ${
                !isNightMode
                  ? 'bg-stone-900 text-white font-medium shadow-2xs'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              Brightly
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsNightMode(true);
              }}
              className={`px-3 py-1 rounded-full text-[10px] font-sans tracking-wide transition-all cursor-pointer ${
                isNightMode
                  ? 'bg-white text-stone-950 font-medium shadow-2xs'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              Midnight
            </button>
          </div>
        </div>
      )}

      {/* 내부 콘텐츠 래퍼: 피그마 비율(780x1386 -> 1x 390x693) 정밀 레이아웃 */}
      <div className="w-full max-w-[430px] min-h-full flex-1 flex flex-col items-center justify-between px-6 pt-[calc(env(safe-area-inset-top,0px)+3.8rem)] pb-[calc(env(safe-area-inset-bottom,0px)+2.5rem)] text-center relative z-10">
        
        {/* 상단 타이틀 영역 */}
        <div className="w-full flex flex-col items-center shrink-0">
          {/* 1. The marriage of (Figma: Weddingday Personal Use 65px -> 1x 32.5px) */}
          <h1
            className={`font-weddingday text-[33px] sm:text-[36px] leading-[1.1] transition-colors duration-300 ${
              isNightMode ? 'text-[#FFFFFF]' : 'text-[#292929]'
            }`}
            style={{
              fontFamily: "'Weddingday Personal Use', 'Bickham Script Pro', cursive",
            }}
          >
            The marriage of
          </h1>

          {/* 2. JANG MIN KI & KWON KI-DEUK (Figma: Cormorant Garamond 500, 48px -> 1x 24px) */}
          {displayNamesEn && (
            <h2
              className={`font-editorial-serif font-medium text-[22px] sm:text-[24px] leading-tight tracking-[0.05em] uppercase mt-4 sm:mt-5 transition-colors duration-300 ${
                isNightMode ? 'text-[#FFFFFF]' : 'text-[#292929]'
              }`}
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
              }}
            >
              {displayNamesEn}
            </h2>
          )}
        </div>

        {/* 중앙 화보 이미지 영역 (Figma: 524px * 484px -> 1x 262px * 242px, aspect-[524/484]) */}
        <div className="w-full flex justify-center items-center my-6 sm:my-8 shrink-0">
          <div
            className={`relative w-[262px] max-w-[70vw] aspect-[524/484] overflow-hidden shadow-sm transition-all duration-300 ${
              isNightMode ? 'bg-stone-800 ring-1 ring-white/10' : 'bg-stone-100 ring-1 ring-black/5'
            }`}
          >
            {coverImage ? (
              <img
                src={coverImage}
                alt="Cover"
                className="w-full h-full object-cover object-center grayscale contrast-105 transition-transform duration-700 ease-out group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-stone-400">
                Wedding Photo
              </div>
            )}
          </div>
        </div>

        {/* 하단 메타 & 안내 문구 영역 */}
        <div className="w-full flex flex-col items-center shrink-0">
          {/* 3. 2027.May 15. 14:00 pm (Figma: Cormorant Garamond 400, 48px -> 1x 24px, letter-spacing 0.04em) */}
          {formattedDate && (
            <p
              className={`font-editorial-serif text-[22px] sm:text-[24px] leading-tight tracking-[0.04em] transition-colors duration-300 ${
                isNightMode ? 'text-[#F0F0F0]' : 'text-[#292929]'
              }`}
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
              }}
            >
              {formattedDate}
            </p>
          )}

          {/* 4. 반얀트리 클럽 앤 스파 서울 (Figma: Spoqa Han Sans Neo 300, 28px -> 1x 14px) */}
          {venueText && (
            <p
              className={`font-sans font-light text-[13.5px] sm:text-[14px] leading-normal tracking-[0.02em] mt-[18px] sm:mt-[20px] transition-colors duration-300 ${
                isNightMode ? 'text-[#B5B5B5]' : 'text-[#333333]'
              }`}
            >
              {venueText}
            </p>
          )}

          {/* 5. Welcome to our Wedding Day (Figma: Cormorant Garamond 400, 34px -> 1x 17px, 피그마 넓은 여백) */}
          <div className="mt-[64px] sm:mt-[72px] flex flex-col items-center">
            <p
              className={`font-editorial-serif text-[16px] sm:text-[17px] leading-tight tracking-[0.06em] transition-colors duration-300 ${
                isNightMode ? 'text-[#9E9E9E]' : 'text-[#444444]'
              }`}
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
              }}
            >
              Welcome to our Wedding Day
            </p>

            {/* 터치 안내 힌트 (은은한 펄스) */}
            <div
              className={`mt-2 flex items-center gap-1 text-[10px] tracking-widest uppercase transition-opacity duration-500 animate-pulse ${
                isNightMode ? 'text-stone-500' : 'text-stone-400'
              }`}
            >
              <span>Tap anywhere to open</span>
            </div>
          </div>
        </div>

      </div>
    </div>

    {/* 시네마틱 껌뻑(Blink / Fade to black) 암전 오버레이 */}
    <div
      className={`${isInModal ? 'absolute inset-0 z-30' : 'fixed inset-0 z-[60]'} bg-black pointer-events-none transition-opacity ${
        transitionStep === 'darkening'
          ? 'opacity-100 duration-[800ms] ease-in-out'
          : transitionStep === 'revealing'
          ? 'opacity-0 duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)]'
          : 'opacity-0 duration-0'
      }`}
    />
  </>
  );
}
