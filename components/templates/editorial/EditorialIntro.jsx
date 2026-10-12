'use client';

import { useState, useEffect, useMemo } from 'react';

export default function EditorialIntro({ invitation, onOpen }) {
  // 'idle' | 'darkening' | 'revealing'
  const [transitionStep, setTransitionStep] = useState('idle');
  const [isShaking, setIsShaking] = useState(false);
  const [declineMsg, setDeclineMsg] = useState('');

  // 화보 커버 이미지 우선순위
  const coverImage =
    invitation?.images?.cover ||
    invitation?.images?.main ||
    invitation?.cover_image ||
    invitation?.extra_data?.cover_image ||
    invitation?.extra_data?.main_image ||
    '/cover.jpg';

  // 영문/한글 이름 및 정보 (하드코딩 완전 배제)
  const groomName = invitation?.groom_name || '';
  const brideName = invitation?.bride_name || '';
  const groomEn = invitation?.groom_first_name_en || invitation?.groom_name_en?.split(' ')[0] || '';
  const brideEn = invitation?.bride_first_name_en || invitation?.bride_name_en?.split(' ')[0] || '';
  const coupleEn = invitation?.main_names_en || (groomEn && brideEn ? `${groomEn} & ${brideEn}` : (groomEn || brideEn || ''));
  
  const venueName = invitation?.venue_name || '';

  // 날짜 포맷 (예: MAY 14, 2026)
  const weddingDateStr = invitation?.wedding_date;
  const dateFormatted = (() => {
    if (!weddingDateStr) return '';
    const normalized = typeof weddingDateStr === 'string' 
      ? weddingDateStr.replace(' ', 'T') 
      : weddingDateStr;
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return '';
    
    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  })();

  useEffect(() => {
    // 인트로 표시 중 스크롤 방지 & 최상단 고정
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      window.scrollTo(0, 0);
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }

    return () => {
      if (typeof window !== 'undefined') {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        if ('scrollRestoration' in window.history) {
          window.history.scrollRestoration = 'auto';
        }
      }
    };
  }, []);

  // 거절(Decline) 클릭 시 에디토리얼 위트 토스트
  const handleDecline = (e) => {
    e.stopPropagation();
    setIsShaking(true);
    setDeclineMsg('저희의 첫 페이지를 꼭 함께 열어주세요 🕊️');
    setTimeout(() => setIsShaking(false), 500);
    setTimeout(() => setDeclineMsg(''), 2500);
  };

  // 매거진 오픈 (Open The Lookbook) 클릭 시 시네마틱 페이드 & BGM 재생
  const handleOpen = (e) => {
    e.stopPropagation();
    if (transitionStep !== 'idle') return;

    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.blur();
    }
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // BGM 재생 이벤트 발생
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

      // 3단계: 어둠이 안개처럼 걷힌 후 인트로 언마운트 (사용자 스크롤 위치 유지)
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';
        }
        const currentY = typeof window !== 'undefined' ? window.scrollY : 0;
        if (onOpen) onOpen();
        if (typeof window !== 'undefined' && currentY > 0) {
          requestAnimationFrame(() => {
            window.scrollTo({ top: currentY, behavior: 'instant' });
          });
        }
      }, 1250);
    }, 850);
  };

  return (
    <>
      {/* 1. 에디토리얼 룩북 커버 프레임 레이어 */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 select-none bg-stone-900/70 backdrop-blur-md transition-opacity duration-300 ${
          transitionStep === 'revealing' 
            ? 'hidden pointer-events-none' 
            : transitionStep === 'darkening'
            ? 'opacity-100 pointer-events-none'
            : 'opacity-100'
        }`}
      >
        <style jsx>{`
          @keyframes editorialShake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-4px); }
            40% { transform: translateX(4px); }
            60% { transform: translateX(-3px); }
            80% { transform: translateX(3px); }
          }
          .editorial-shake {
            animation: editorialShake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
          }
        `}</style>

        {/* 매거진 룩북 슬리브 카드 (화보집 표지 형태) */}
        <div
          className={`relative w-full max-w-[340px] bg-white border border-stone-200/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] p-5 sm:p-6 flex flex-col transition-all duration-300 ${
            isShaking ? 'editorial-shake' : ''
          }`}
        >
          {/* 상단 매거진 마스트헤드 (Volume & Issue 헤더) */}
          <div className="flex items-center justify-between text-[9.5px] tracking-[0.25em] text-stone-400 font-editorial-serif uppercase pb-2.5 border-b border-stone-200">
            <span>VOL. 01 · SPECIAL ISSUE</span>
            <span>WEDDING LOOKBOOK</span>
          </div>

          {/* 메인 타이틀 (클래식 세리프) */}
          {(coupleEn || dateFormatted) && (
            <div className="text-center pt-3 pb-3">
              {coupleEn && (
                <h1 className="font-editorial-title text-[26px] sm:text-[28px] text-stone-900 tracking-normal leading-tight">
                  {coupleEn}
                </h1>
              )}
              {dateFormatted && (
                <p className="font-editorial-serif text-[10.5px] tracking-[0.22em] text-stone-500 uppercase mt-1">
                  {dateFormatted}
                </p>
              )}
            </div>
          )}

          {/* 중앙 화보 사진 프레임 (매거진 룩북 Spread) */}
          <div className="relative w-full aspect-[4/5] bg-stone-100 overflow-hidden border border-stone-200/80 mb-3.5 group">
            <img
              src={coverImage}
              alt="Editorial Lookbook Cover"
              className="w-full h-full object-cover select-none transition-transform duration-700 group-hover:scale-102"
              onError={(e) => {
                if (e.currentTarget.src !== '/cover.jpg') {
                  e.currentTarget.src = '/cover.jpg';
                }
              }}
            />

            {/* 화보 뱃지 태그 */}
            <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-editorial-serif tracking-widest uppercase px-2 py-0.5">
              COVER SPREAD
            </div>

            {/* 거절 시 나타나는 감성 세리프 토스트 */}
            {declineMsg && (
              <div className="absolute inset-x-2 bottom-3 z-20 flex justify-center animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-stone-900/95 backdrop-blur-md text-white text-[11px] font-editorial-serif tracking-wide py-2 px-3.5 shadow-xl text-center border border-white/10">
                  {declineMsg}
                </div>
              </div>
            )}
          </div>

          {/* 신랑 신부 안내 텍스트 (입력된 정보만 노출) */}
          {(groomName || brideName || venueName) && (
            <div className="text-center mb-4">
              {(groomName || brideName) && (
                <p className="font-editorial-serif text-[12.5px] text-stone-700 tracking-wider">
                  {[groomName, brideName].filter(Boolean).join(' · ')}
                </p>
              )}
              {venueName && (
                <p className="font-editorial-serif text-[11px] text-stone-400 tracking-wide mt-0.5">
                  {venueName}
                </p>
              )}
            </div>
          )}

          {/* 하단 메인 액션 버튼: OPEN THE LOOKBOOK */}
          <button
            type="button"
            onClick={handleOpen}
            className="w-full py-3 bg-stone-900 hover:bg-black active:bg-stone-950 text-white text-[11.5px] font-editorial-serif tracking-[0.22em] uppercase transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm cursor-pointer group mb-2"
          >
            <span>Open The Lookbook</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </button>

          {/* 서브 Decline 위트 링크 */}
          <div className="text-center pb-2">
            <button
              type="button"
              onClick={handleDecline}
              className="text-[10px] font-editorial-serif tracking-wider text-stone-400 hover:text-stone-600 transition-colors uppercase underline underline-offset-3 cursor-pointer"
            >
              Regretfully Decline
            </button>
          </div>

          {/* 최하단 바코드 & 에디토리얼 아카이브 메타 */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[8.5px] font-mono text-stone-400 tracking-wider">
            <span>EDITION NO. WEDDING ISSUE</span>
            <span>ALL RIGHTS RESERVED ©</span>
          </div>
        </div>
      </div>

      {/* 2. 시네마틱 껌뻑(Blink / Fade to black) 암전 오버레이 */}
      <div
        className={`fixed inset-0 z-[60] bg-black pointer-events-none transition-opacity ${
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
