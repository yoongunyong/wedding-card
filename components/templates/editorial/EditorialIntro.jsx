'use client';

import { useState, useEffect } from 'react';

export default function EditorialIntro({ invitation, onOpen }) {
  // 'idle' | 'darkening' | 'revealing'
  const [transitionStep, setTransitionStep] = useState('idle');

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
      {/* 1. 에디토리얼 인트로 전체 컨테이너 */}
      <div
        className={`fixed inset-0 z-50 flex flex-col justify-start items-center px-4 pt-[calc(env(safe-area-inset-top,0px)+2.5rem)] sm:pt-12 pb-8 select-none overflow-y-auto transition-opacity duration-300 ${
          transitionStep === 'revealing' 
            ? 'hidden pointer-events-none' 
            : transitionStep === 'darkening'
            ? 'opacity-100 pointer-events-none'
            : 'opacity-100'
        }`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* 1-1. 백그라운드 텍스처 (피그마 원본 image 735 + rgba(0,0,0,0.49) 틴트) */}
        <div className="fixed inset-0 pointer-events-none select-none overflow-hidden -z-10 bg-[#1c1c1c]">
          <img
            src={coverBgImage}
            alt="Editorial Background"
            className="w-full h-full object-cover object-center"
          />
          {/* 피그마 원본 딥 틴트 오버레이 (rgba(0,0,0,0.49)) */}
          <div className="absolute inset-0 bg-black/[0.49]" />
        </div>

        {/* 1-2. 중앙 클러스터: 상단 손글씨 타이틀 + 중앙 화이트 카드 + 하단 날짜 (피그마 390x693 1:1) */}
        <div className="relative z-10 w-full max-w-[310px] sm:max-w-[325px] flex flex-col items-center py-1">
          
          {/* 상단: 리얼 캘리그래피 손글씨 애니메이션 (피그마 원본 Weddingday 폰트 1:1 그래픽 & 단어별 잉크 플로우) */}
          <div className="w-full text-center mb-4 sm:mb-5 shrink-0 px-1 flex justify-center items-center min-h-[58px] sm:min-h-[64px]">
            <div className="relative inline-block w-[260px] sm:w-[280px]">
              {/* 손글씨 텍스트 (사선 캘리그래피 획 마스크로 리드미컬하게 써지는 모션) */}
              <img
                src="/samples/editorial-we-are-getting-married.png"
                alt="We are getting married"
                className="editorial-handwriting-stroke w-full h-auto object-contain select-none pointer-events-none"
              />
              {/* 펜촉 이동 잉크 포인트 */}
              <span className="editorial-pen-nib" aria-hidden="true" />
            </div>
          </div>

          {/* 중앙: 피그마 화이트 프레임 카드 (Rectangle 6219: 619x998 -> 310x500 1x) */}
          <div className="w-full animate-in fade-in zoom-in-98 duration-500 shrink-0">
            <div className="w-full bg-[#fefefe] shadow-[0_20px_50px_rgba(0,0,0,0.35)] p-2.5 sm:p-3 flex flex-col items-center">
              
              {/* 상단 화보 사진: DB 커버사진 연동 (피그마 image 736: 578x721 -> 비율 578/721 = 0.8016) */}
              <div className="relative w-full aspect-[578/721] max-h-[44vh] sm:max-h-[48vh] bg-stone-100 overflow-hidden flex items-center justify-center">
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
                {/* COVER SPREAD 뱃지 */}
                <div className="absolute top-2 left-2 bg-black/55 backdrop-blur-xs text-white text-[8.5px] font-cormorant tracking-[0.24em] uppercase px-2.5 py-0.5 select-none">
                  COVER SPREAD
                </div>
              </div>

              {/* 하단 성함(피그마 30px->15px #292929), 웨딩홀(피그마 26px->13px #666666), 버튼(피그마 332x79 -> 166x39.5) */}
              <div className="w-full text-center pt-5 pb-4 sm:pb-4.5 px-2 flex flex-col items-center">
                {coupleKo && (
                  <p className="font-serif text-[15px] sm:text-[15.5px] text-[#292929] font-normal tracking-tight">
                    {coupleKo}
                  </p>
                )}

                {venueName && (
                  <p className="font-serif text-[13px] text-[#666666] font-normal tracking-tight mt-2 mb-3.5 sm:mb-4">
                    {venueName}
                  </p>
                )}

                {/* 파스텔 블루 기하 타원 OPEN THE LOOKBOOK 버튼 (피그마 Ellipse 749: 332x79 -> 166x39.5, #D7E3EF, #282828) */}
                <button
                  type="button"
                  onClick={handleOpen}
                  className="w-[166px] sm:w-[172px] h-[39.5px] sm:h-[40px] rounded-[50%] bg-[#D7E3EF] hover:bg-[#CADAE8] active:bg-[#BFD1E2] border border-[#9EBCD5] text-[#282828] text-[11px] font-bodoni font-bold tracking-[0.03em] uppercase shadow-2xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 group select-none"
                  style={{ borderRadius: '50%' }}
                >
                  <span className="leading-none pt-0.5">OPEN THE LOOKBOOK</span>
                  <svg width="13" height="7" viewBox="0 0 13 7" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5">
                    <path d="M0 3.5H11.5M11.5 3.5L8.5 0.8M11.5 3.5L8.5 6.2" stroke="#282828" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* 하단: 화이트 세리프 날짜 (피그마 Noto Serif KR 26px->13px #f3f3f3, 상단 간격 40.5px) */}
          {dateFormatted && (
            <div className="w-full text-center mt-7 sm:mt-8 shrink-0">
              <p className="font-serif text-[#f3f3f3] text-[13px] sm:text-[13.5px] tracking-[0.08em] font-normal select-none drop-shadow-sm">
                {dateFormatted}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 2. 사선 캘리그래피 획 마스크 & 펜촉 이동 인라인 CSS */}
      <style jsx>{`
        .editorial-handwriting-stroke {
          display: block;
          filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.4));
          animation: realHandwritingDraw 2.4s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
          will-change: mask-image, -webkit-mask-image;
        }

        /* 필기체 펜촉 각도(115deg)와 단어별 리듬(We -> are -> getting -> married)에 맞춘 잉크 드로잉 */
        @keyframes realHandwritingDraw {
          0% {
            -webkit-mask-image: linear-gradient(115deg, black 0%, black 0%, transparent 3%, transparent 100%);
            mask-image: linear-gradient(115deg, black 0%, black 0%, transparent 3%, transparent 100%);
            opacity: 0.2;
          }
          /* We 완성 (약 0.45초) */
          18% {
            -webkit-mask-image: linear-gradient(115deg, black 0%, black 20%, transparent 24%, transparent 100%);
            mask-image: linear-gradient(115deg, black 0%, black 20%, transparent 24%, transparent 100%);
            opacity: 1;
          }
          /* are 완성 (약 0.9초) */
          38% {
            -webkit-mask-image: linear-gradient(115deg, black 0%, black 38%, transparent 43%, transparent 100%);
            mask-image: linear-gradient(115deg, black 0%, black 38%, transparent 43%, transparent 100%);
          }
          /* getting 완성 (약 1.6초) */
          68% {
            -webkit-mask-image: linear-gradient(115deg, black 0%, black 67%, transparent 72%, transparent 100%);
            mask-image: linear-gradient(115deg, black 0%, black 67%, transparent 72%, transparent 100%);
          }
          /* married 완성 (약 2.3초) */
          96% {
            -webkit-mask-image: linear-gradient(115deg, black 0%, black 97%, transparent 100%, transparent 100%);
            mask-image: linear-gradient(115deg, black 0%, black 97%, transparent 100%, transparent 100%);
          }
          100% {
            -webkit-mask-image: none;
            mask-image: none;
            opacity: 1;
            filter: drop-shadow(0 2px 10px rgba(0, 0, 0, 0.5));
          }
        }

        /* 펜촉 잉크 광원 효과 (단어들의 중심선 높낮이와 사선 각도를 따라 정밀 이동) */
        .editorial-pen-nib {
          position: absolute;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(255, 235, 185, 0.8) 35%, rgba(255, 255, 255, 0) 70%);
          pointer-events: none;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.9), 0 0 20px rgba(255, 220, 160, 0.6);
          animation: realPenNibMove 2.4s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
          will-change: left, top, opacity;
        }

        @keyframes realPenNibMove {
          0% {
            left: 2%;
            top: 40%;
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.3);
          }
          3% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.1);
          }
          /* We */
          18% {
            left: 20%;
            top: 48%;
          }
          /* are */
          38% {
            left: 38%;
            top: 50%;
          }
          /* getting */
          68% {
            left: 67%;
            top: 44%;
          }
          /* married */
          96% {
            left: 98%;
            top: 42%;
            opacity: 1;
            transform: translate(-50%, -50%) scale(0.9);
          }
          100% {
            left: 100%;
            top: 42%;
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.2);
          }
        }
      `}</style>

      {/* 3. 시네마틱 껌뻑(Blink / Fade to black) 암전 오버레이 */}
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
