'use client';

import { useState, useEffect } from 'react';

export default function EnvelopeIntro({ invitation, onOpen }) {
  // 'idle' | 'darkening' | 'revealing'
  const [transitionStep, setTransitionStep] = useState('idle');
  const [isShaking, setIsShaking] = useState(false);
  const [declineMsg, setDeclineMsg] = useState('');

  // DB images.cover 최우선 매핑 (고객이 업로드한 대표 커버 사진)
  const rawCover = 
    invitation?.images?.cover || 
    invitation?.cover_image || 
    invitation?.images?.couple_profile ||
    invitation?.images?.main;

  // DB에 유효한 커버 사진이 없을 때(또는 배경/더미 링크일 때)만 기본 피켓 커플 화보로 안전하게 fallback
  const isInvalidCover = 
    !rawCover || 
    typeof rawCover !== 'string' ||
    rawCover.includes('airdrop-bg') || 
    rawCover.includes('photo-1519741497674-611481863552');

  const couplePhoto = !isInvalidCover ? rawCover : '/airdrop-couple.png';

  // 뒷배경: 원본 스크린샷 특유의 고급스러운 웜 브라운 아치 시그니처 블러 배경 고정 (옵션 B)
  const bgImage = invitation?.extra_data?.bg_image || '/airdrop-bg.jpg';

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
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 select-none overflow-y-auto ${
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
        <div className="fixed inset-0 -z-10 bg-[#2D2018] overflow-hidden pointer-events-none">
          <img
            src={bgImage}
            alt="Wedding Signature Background"
            className="w-full h-full object-cover object-center pointer-events-none"
            onError={(e) => {
              if (e.currentTarget.src !== '/airdrop-bg.jpg') {
                e.currentTarget.src = '/airdrop-bg.jpg';
              }
            }}
          />
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
          <div className="relative w-full aspect-[419/440] bg-[#E5E5EA] overflow-hidden shrink-0">
            <img
              src={couplePhoto}
              alt="Our Wedding Day"
              className="w-full h-full object-cover object-center pointer-events-none"
              onError={(e) => {
                if (e.currentTarget.src !== '/airdrop-couple.png') {
                  e.currentTarget.src = '/airdrop-couple.png';
                }
              }}
            />
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
        className={`fixed inset-0 z-[60] bg-black pointer-events-none transition-opacity ${
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
