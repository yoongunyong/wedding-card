'use client';

import { useState, useEffect } from 'react';

export default function EnvelopeIntro({ invitation, onOpen, isInModal: propIsInModal }) {
  // 'idle' | 'darkening' | 'revealing'
  const [transitionStep, setTransitionStep] = useState('idle');
  const [isShaking, setIsShaking] = useState(false);
  const [declineMsg, setDeclineMsg] = useState('');
  const isInModal = Boolean(propIsInModal ?? invitation?.is_modal_preview);

  // DB images.cover 최우선 매핑 (고객이 업로드한 대표 커버 사진)
  const rawCover = 
    invitation?.images?.cover || 
    invitation?.cover_image || 
    invitation?.images?.couple_profile ||
    invitation?.images?.main;

  const isSample = Boolean(
    invitation?.is_sample_preview || 
    ['basic', 'editorial', 'playlist', 'cinematic', 'scene'].includes(invitation?.slug)
  );

  // DB에 유효한 커버 사진이 없을 때(또는 배경/더미 링크일 때)만 기본 피켓 커플 화보로 안전하게 fallback (샘플일 때만)
  const isInvalidCover = 
    !rawCover || 
    typeof rawCover !== 'string' ||
    rawCover.includes('airdrop-bg') || 
    rawCover.includes('photo-1519741497674-611481863552');

  const couplePhoto = !isInvalidCover ? rawCover : (isSample ? '/airdrop-couple.png' : '');

  // 뒷배경: 고객 업로드 사진 또는 샘플 배경
  const bgImage = invitation?.extra_data?.bg_image || (!isInvalidCover ? rawCover : (isSample ? '/airdrop-bg.jpg' : ''));

  useEffect(() => {
    // 모달 미리보기 중에는 부모 페이지의 전체 창 스크롤 및 overflow를 방해하지 않음
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

  // 거절 클릭 시 위트 있는 셰이크 애니메이션 & 안내 토스트
  const handleDecline = (e) => {
    e.stopPropagation();
    setIsShaking(true);
    setDeclineMsg('거절하실 수 없습니다. 꼭 축하해주세요 🤍');
    setTimeout(() => setIsShaking(false), 500);
    setTimeout(() => setDeclineMsg(''), 2200);
  };

  // 수락 클릭 시 시네마틱 전환 효과 & BGM 재생
  const handleAccept = (e) => {
    e.stopPropagation();
    if (transitionStep !== 'idle') return;

    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.blur();
    }
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // 수락 클릭 시 BGM 재생 이벤트 발생
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('play-wedding-bgm'));
    }

    // 1단계: 화면이 부드럽게 암전
    setTransitionStep('darkening');

    // 2단계: 본문 드러내기 시작
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        window.focus();
      }
      setTransitionStep('revealing');

      // 3단계: 인트로 언마운트
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
      }, 1000);
    }, 700);
  };

  return (
    <>
      {/* 1. iOS 정통 AirDrop 오프닝 인트로 레이어 (스크롤 가능 및 반응형 핏) */}
      <div
        className={`${
          isInModal ? 'absolute inset-0 z-20 w-full h-full min-h-full' : 'fixed inset-0 z-50'
        } flex items-center justify-center p-4 select-none overflow-y-auto ${
          transitionStep === 'revealing'
            ? 'hidden pointer-events-none'
            : transitionStep === 'darkening'
            ? 'opacity-100 pointer-events-none'
            : 'opacity-100'
        }`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <style jsx>{`
          @keyframes shakeAnim {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-8px) rotate(-1.5deg); }
            40% { transform: translateX(8px) rotate(1.5deg); }
            60% { transform: translateX(-5px); }
            80% { transform: translateX(5px); }
          }
          .modal-shake {
            animation: shakeAnim 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
          }
        `}</style>

        {/* 원본 스크린샷 기반 시그니처 웜 브라운 아치 햇살 배경 (고정 레이어) */}
        <div className={`${isInModal ? 'absolute inset-0' : 'fixed inset-0'} -z-10 bg-[#2D2018] overflow-hidden pointer-events-none`}>
          {bgImage && (
            <img
              src={bgImage}
              alt="Wedding Signature Background"
              className="w-full h-full object-cover object-center pointer-events-none"
              onError={(e) => {
                if (isSample && e.currentTarget.src !== '/airdrop-bg.jpg') {
                  e.currentTarget.src = '/airdrop-bg.jpg';
                } else {
                  e.currentTarget.style.display = 'none';
                }
              }}
            />
          )}
          {/* 원본의 따뜻한 감성을 그대로 보존하기 위한 미세 비네팅 */}
          <div className="absolute inset-0 bg-black/5 pointer-events-none" />
        </div>

        {/* iOS 정통 AirDrop 모달 카드 (576x1024 스크린샷 100% 픽셀 매칭) */}
        <div
          className={`relative w-[85%] max-w-[335px] bg-[#EFEFF4]/95 backdrop-blur-2xl rounded-[28px] overflow-hidden shadow-[0_25px_60px_-10px_rgba(0,0,0,0.5)] border border-white/40 transition-transform duration-300 flex flex-col ${
            isShaking ? 'modal-shake' : ''
          }`}
        >
          {/* 상단 텍스트 영역: 여백과 폰트 크기 완벽 조정 */}
          <div className="pt-6 pb-4 px-4 text-center shrink-0">
            <h2 className="text-[18px] font-bold text-[#111111] tracking-tight font-sans">
              AirDrop
            </h2>
            <p className="text-[13px] text-[#333333] mt-1 font-normal leading-tight tracking-tight font-sans">
              우리의 결혼식을 공유하려고 합니다.
            </p>
            <div className="mt-1 text-[15px] text-[#666666] font-light leading-none">
              ♡
            </div>
          </div>

          {/* 중앙 사진: 카드 좌우 폭에 100% 꽉 찬 직사각형 (aspect-[419/440]) */}
          <div className="relative w-full aspect-[419/440] bg-[#E5E5EA] overflow-hidden shrink-0 flex items-center justify-center">
            {couplePhoto ? (
              <img
                src={couplePhoto}
                alt="Our Wedding Day"
                className="w-full h-full object-cover object-center pointer-events-none"
                onError={(e) => {
                  if (isSample && e.currentTarget.src !== '/airdrop-couple.png') {
                    e.currentTarget.src = '/airdrop-couple.png';
                  } else {
                    e.currentTarget.style.display = 'none';
                  }
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-stone-500">
                <div className="w-14 h-14 rounded-full bg-stone-300/70 flex items-center justify-center mb-2.5 text-stone-600">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-[12px] font-sans font-medium tracking-wider text-stone-600">WEDDING INVITATION</p>
                <p className="text-[11px] text-stone-500 mt-1">소중한 분들을 초대합니다</p>
              </div>
            )}
          </div>

          {/* 거절 시 나타나는 위트있는 토스트 알림 */}
          {declineMsg && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-[85%] animate-bounce">
              <div className="bg-black/90 backdrop-blur-md text-white text-[12px] font-medium py-2.5 px-4 rounded-full shadow-2xl text-center leading-snug">
                {declineMsg}
              </div>
            </div>
          )}

          {/* 하단 버튼 바: iOS 2분할 버튼 (거절 / 수락) */}
          <div className="grid grid-cols-2 divide-x divide-[#D1D1D6] border-t border-[#D1D1D6] bg-[#EFEFF4] shrink-0">
            <button
              type="button"
              onClick={handleDecline}
              className="py-3.5 text-[17px] font-normal text-[#007AFF] hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer select-none font-sans text-center"
            >
              거절
            </button>
            <button
              type="button"
              onClick={handleAccept}
              className="py-3.5 text-[17px] font-semibold text-[#007AFF] hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer select-none font-sans text-center"
            >
              수락
            </button>
          </div>
        </div>
      </div>

      {/* 2. 시네마틱 페이드 암전 오버레이 */}
      <div
        className={`${
          isInModal ? 'absolute inset-0 z-30 w-full h-full' : 'fixed inset-0 z-[60]'
        } bg-black pointer-events-none transition-opacity ${
          transitionStep === 'darkening'
            ? 'opacity-100 duration-[700ms] ease-in-out'
            : transitionStep === 'revealing'
            ? 'opacity-0 duration-[1000ms] ease-out'
            : 'opacity-0 duration-0'
        }`}
      />
    </>
  );
}
