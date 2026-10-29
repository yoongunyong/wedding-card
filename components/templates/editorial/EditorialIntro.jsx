'use client';

import { useState, useEffect } from 'react';

export default function EditorialIntro({ invitation, onOpen }) {
  // 'idle' | 'darkening' | 'revealing'
  const [transitionStep, setTransitionStep] = useState('idle');

  const isSample = Boolean(invitation?.is_sample_preview || invitation?.slug === 'editorial');

  // 화보 커버 이미지 우선순위
  const coverImage =
    invitation?.images?.cover ||
    invitation?.images?.main ||
    invitation?.cover_image ||
    invitation?.extra_data?.cover_image ||
    invitation?.extra_data?.main_image ||
    (isSample ? '/samples/main-02-editorial.jpg' : '/samples/main-02-editorial.jpg');

  // 신랑·신부 한글 성함
  const groomName = invitation?.groom_name || '';
  const brideName = invitation?.bride_name || '';
  const coupleKo = [groomName, brideName].filter(Boolean).join(' · ') || (isSample ? '강민준 · 박지민' : '');

  // 웨딩홀
  const venueName = invitation?.venue_name || (isSample ? '반얀트리 클럽 앤 스파 서울' : '');

  // 날짜 포맷 (예: May 15. 2027)
  const weddingDateStr = invitation?.wedding_date;
  const dateFormatted = (() => {
    if (!weddingDateStr) return isSample ? 'May 15. 2027' : '';
    const normalized = typeof weddingDateStr === 'string' 
      ? weddingDateStr.replace(' ', 'T') 
      : weddingDateStr;
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return isSample ? 'May 15. 2027' : '';
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}. ${d.getFullYear()}`;
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

  // 매거진 오픈 (OPEN THE LOOKBOOK) 클릭 시 시네마틱 페이드 & BGM 재생
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
      {/* 1. 에디토리얼 인트로 전체 컨테이너 (스크롤 가능 및 높이 반응형 핏) */}
      <div
        className={`fixed inset-0 z-50 flex flex-col justify-between items-center px-4 py-5 sm:py-8 select-none overflow-y-auto transition-opacity duration-300 ${
          transitionStep === 'revealing' 
            ? 'hidden pointer-events-none' 
            : transitionStep === 'darkening'
            ? 'opacity-100 pointer-events-none'
            : 'opacity-100'
        }`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* 1-1. 백그라운드 이미지 (블러 처리 & 고정 레이어) */}
        <div className="fixed inset-0 pointer-events-none select-none overflow-hidden -z-10">
          <img
            src="/samples/editorial_intro_background.png"
            alt="Editorial Background"
            className="w-full h-full object-cover object-center scale-110 filter blur-[9px]"
          />
          {/* 부드러운 딥 틴트 오버레이 */}
          <div className="absolute inset-0 bg-[#142334]/40" />
        </div>

        {/* 1-2. 상단: Bickham Script Pro 필기체 문구 */}
        <div className="relative z-10 w-full text-center pt-1 sm:pt-2 mb-3 sm:mb-5 shrink-0">
          <h1
            className="text-white text-[26px] sm:text-[32px] font-normal tracking-normal italic drop-shadow-md select-none leading-tight"
            style={{
              fontFamily: "'Bickham Script Pro', 'Bickham Script Pro 3', 'Great Vibes', 'Alex Brush', cursive",
            }}
          >
            We are getting married
          </h1>
        </div>

        {/* 1-3. 중앙: 화이트 프레임 카드 (단정하게 중앙 배치, 뷰포트 높이 초과 방지) */}
        <div className="relative z-10 w-full max-w-[305px] sm:max-w-[325px] my-auto animate-in fade-in zoom-in-98 duration-500 shrink-0">
          <div className="w-full bg-white shadow-[0_20px_50px_rgba(0,0,0,0.35)] p-3 sm:p-3.5 flex flex-col items-center">
            
            {/* 상단 화보 사진 (Cover Spread - 반응형 최대 높이 제한) */}
            <div className="relative w-full aspect-[4/4.5] max-h-[44vh] sm:max-h-[48vh] bg-stone-100 overflow-hidden">
              <img
                src={coverImage}
                alt="Editorial Lookbook Cover"
                className="w-full h-full object-cover select-none"
                onError={(e) => {
                  if (e.currentTarget.src !== '/samples/main-02-editorial.jpg') {
                    e.currentTarget.src = '/samples/main-02-editorial.jpg';
                  }
                }}
              />
              {/* COVER SPREAD 뱃지 */}
              <div className="absolute top-2 left-2 bg-black/55 backdrop-blur-xs text-white text-[8px] sm:text-[8.5px] font-serif tracking-[0.22em] uppercase px-2 py-0.5 select-none">
                COVER SPREAD
              </div>
            </div>

            {/* 하단 성함, 웨딩홀, 버튼 */}
            <div className="w-full text-center pt-3 pb-2 sm:pb-2.5 px-1 flex flex-col items-center">
              {coupleKo && (
                <p className="font-serif text-[15px] sm:text-[16px] text-stone-900 font-medium tracking-tight">
                  {coupleKo}
                </p>
              )}

              {venueName && (
                <p className="font-serif text-[11px] sm:text-[11.5px] text-stone-400 font-normal tracking-tight mt-0.5 mb-2.5 sm:mb-3">
                  {venueName}
                </p>
              )}

              {/* 연하늘색 알약형 OPEN THE LOOKBOOK 버튼 */}
              <button
                type="button"
                onClick={handleOpen}
                className="inline-flex items-center justify-center gap-1.5 px-5 sm:px-6 py-1.5 sm:py-2 rounded-full bg-[#DDE8F4] hover:bg-[#CFE0F0] active:bg-[#C2D6E8] border border-[#BED4E8] text-stone-800 text-[10px] sm:text-[10.5px] font-serif tracking-[0.16em] uppercase font-medium shadow-2xs transition-all duration-200 cursor-pointer group"
              >
                <span>OPEN THE LOOKBOOK</span>
                <span className="text-[11px] transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </button>
            </div>
          </div>
        </div>

        {/* 1-4. 하단: 화이트 세리프 날짜 (안정적인 하단 배치) */}
        {dateFormatted && (
          <div className="relative z-10 w-full text-center mt-3 sm:mt-5 pb-2 sm:pb-4 shrink-0">
            <p className="font-serif text-white/85 text-[12px] sm:text-[12.5px] tracking-[0.08em] select-none drop-shadow-sm">
              {dateFormatted}
            </p>
          </div>
        )}
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
