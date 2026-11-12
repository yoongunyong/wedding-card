'use client';

import { useState, useEffect } from 'react';
import EditorialTitleHandwriting from './EditorialTitleHandwriting';

export default function EditorialIntro({ invitation, onOpen, isInModal: propIsInModal }) {
  // 'idle' | 'darkening' | 'revealing'
  const [transitionStep, setTransitionStep] = useState('idle');
  const isInModal = Boolean(propIsInModal ?? invitation?.is_modal_preview);

  const isSample = Boolean(invitation?.is_sample_preview || invitation?.slug === 'editorial');

  // 화보 커버 이미지: 카드 안에 들어가는 사진 (고객 등록 cover 최우선, 없을 시 main 또는 샘플)
  const coverImage =
    invitation?.images?.cover ||
    invitation?.cover_image ||
    invitation?.extra_data?.cover_image ||
    (isSample ? '/samples/main-02-editorial.jpg' : (invitation?.images?.main || ''));

  // 배경 이미지: 프로젝트에 영구 저장된 피그마 원본 텍스처 배경(image 735) 사용
  const coverBgImage = '/samples/editorial_intro_background.png';

  // 신랑·신부 한글 성함 (피그마 2832:2135 -> Noto Serif KR 15px #292929)
  const groomName = invitation?.groom_name || '';
  const brideName = invitation?.bride_name || '';
  const coupleKo = [groomName, brideName].filter(Boolean).join(' · ') || (isSample ? '강민준 · 박지민' : '');

  // 웨딩홀 (피그마 2832:2137 -> Noto Serif KR 13px #666666)
  const venueName = invitation?.venue_name || (isSample ? '반얀트리 클럽 앤 스파 서울' : '');

  // 날짜 포맷 (예: May 15. 2027 / 피그마 2832:2139 -> Noto Serif KR 13px #f3f3f3)
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
    // 모달 미리보기 중에는 부모 페이지의 스크롤 및 overflow를 건드리지 않음
    const isInsideModal = isInModal || (typeof document !== 'undefined' && Boolean(document.getElementById('preview-scroll-container')));
    if (isInsideModal) return;

    // 하객용 실제 청첩장 화면에서만 스크롤 방지 & 최상단 고정
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
      {/* 1. 에디토리얼 인트로 전체 컨테이너 */}
      <div
        className={`${isInModal ? 'absolute inset-0 z-20' : 'fixed inset-0 z-50'} flex flex-col justify-start items-center px-4 pt-[calc(env(safe-area-inset-top,0px)+2.5rem)] sm:pt-12 pb-8 select-none overflow-y-auto transition-opacity duration-300 ${
          transitionStep === 'revealing' 
            ? 'hidden pointer-events-none' 
            : transitionStep === 'darkening'
            ? 'opacity-100 pointer-events-none'
            : 'opacity-100'
        }`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* 1-1. 백그라운드 텍스처 (피그마 원본 image 735 + rgba(0,0,0,0.49) 틴트) */}
        <div className={`${isInModal ? 'absolute inset-0' : 'fixed inset-0'} pointer-events-none select-none overflow-hidden -z-10 bg-[#1c1c1c]`}>
          <img
            src={coverBgImage}
            alt="Editorial Background"
            className="w-full h-full object-cover object-center"
          />
          {/* 피그마 원본 딥 틴트 오버레이 (rgba(0,0,0,0.49)) */}
          <div className="absolute inset-0 bg-black/[0.49]" />
        </div>

        {/* 1-2. 중앙 클러스터: 상단 손글씨 타이틀 + 중앙 화이트 카드 + 하단 날짜 (Figma 프레임 1:1 매칭) */}
        <div className="relative z-10 w-full max-w-[310px] flex flex-col items-center py-1">
          
          {/* 상단: We are getting married 타이핑 타이틀 (Figma 2832:2131: Weddingday Personal Use 80px -> 1x 40px) */}
          <div className="w-full text-center mb-[24px] shrink-0 flex justify-center items-center">
            <EditorialTitleHandwriting />
          </div>

          {/* 중앙: 피그마 화이트 프레임 카드 (Figma Rectangle 6219: 619x998 -> 1x 309.5x499, background: #FEFEFE) */}
          <div className="w-full shrink-0">
            <div className="w-[309.5px] max-w-full bg-[#FEFEFE] shadow-[0_20px_50px_rgba(0,0,0,0.35)] p-[10.25px] pb-[18px] flex flex-col items-center">
              
              {/* 상단 화보 사진: DB 커버사진 연동 (Figma image 736: 578x721 -> 비율 578/721 = 0.8016) */}
              <div className="relative w-full aspect-[578/721] bg-stone-100 overflow-hidden flex items-center justify-center">
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt="Editorial Lookbook Cover"
                    className="w-full h-full object-cover select-none"
                    onError={(e) => {
                      if (isSample && e.currentTarget.src !== '/samples/main-02-editorial.jpg') {
                        e.currentTarget.src = '/samples/main-02-editorial.jpg';
                      }
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-stone-400 select-none">
                    <span className="font-bickham text-4xl mb-1 text-stone-500" style={{ fontFamily: "'Bickham Script Pro', cursive" }}>M</span>
                    <span className="font-serif text-[10px] tracking-[0.24em] uppercase text-stone-400">LOOKBOOK</span>
                  </div>
                )}
              </div>

              {/* 하단 성함(Figma: NanumSquare Neo OTF 30px -> 1x 15px #292929, 간격 22px) */}
              {coupleKo && (
                <p className="font-nanumsquare text-[15px] text-[#292929] font-normal leading-none tracking-tight text-center mt-[22px]">
                  {coupleKo}
                </p>
              )}

              {/* 웨딩홀(Figma: NanumSquare Neo OTF 26px -> 1x 13px #666666, 간격 14px) */}
              {venueName && (
                <p className="font-nanumsquare text-[13px] text-[#666666] font-normal leading-none tracking-tight text-center mt-[14px]">
                  {venueName}
                </p>
              )}

              {/* 파스텔 블루 기하 타원 OPEN THE LOOKBOOK 버튼 (Figma Ellipse 749: 332x79 -> 166x39.5, #D7E3EF, border: 1px solid #909090, 간격 15px) */}
              <button
                type="button"
                onClick={handleOpen}
                style={{ borderRadius: '50%' }}
                className="w-[166px] h-[39.5px] bg-[#D7E3EF] hover:bg-[#CADAE8] active:bg-[#BFD1E2] border border-[#909090] text-[#282828] transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 group select-none mt-[15px]"
              >
                <span className="font-bodoni font-bold text-[9.5px] tracking-[0.04em] uppercase leading-none">
                  OPEN &nbsp;THE &nbsp;LOOKBOOK
                </span>
                <svg width="11" height="7" viewBox="0 0 11 7" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ml-0.5">
                  <path d="M0.5 3.5H9.5M9.5 3.5L7 1M9.5 3.5L7 6" stroke="#282828" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* 하단: 화이트 날짜 (Figma May 15. 2027: 세리프 #f3f3f3, 상단 간격 28px) */}
          {dateFormatted && (
            <div className="w-full text-center mt-[28px] shrink-0">
              <p className="font-serif text-[#f3f3f3] text-[13px] sm:text-[13.5px] tracking-[0.08em] font-normal select-none drop-shadow-sm">
                {dateFormatted}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 2. 시네마틱 껌뻑(Blink / Fade to black) 암전 오버레이 */}
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
