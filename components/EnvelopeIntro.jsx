'use client';

import { useState, useEffect } from 'react';

export default function EnvelopeIntro({ invitation, onOpen }) {
  // 'idle' | 'darkening' | 'revealing'
  const [transitionStep, setTransitionStep] = useState('idle');
  const [isShaking, setIsShaking] = useState(false);
  const [declineMsg, setDeclineMsg] = useState('');

  // Supabase 신규 images.cover 최우선 매핑 (하위 호환 유지)
  const coverImage =
    invitation?.images?.cover ||
    invitation?.cover_image ||
    invitation?.extra_data?.cover_image ||
    invitation?.extra_data?.main_image ||
    invitation?.main_image ||
    '/cover.jpg';

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

  // Decline 클릭 시 위트 있는 셰이크 & 안내
  const handleDecline = (e) => {
    e.stopPropagation();
    setIsShaking(true);
    setDeclineMsg('거절하실 수 없습니다. 꼭 축하해주세요 🤍');
    setTimeout(() => setIsShaking(false), 500);
    setTimeout(() => setDeclineMsg(''), 2200);
  };

  // Accept 클릭 시 깊고 서정적인 시네마틱 전환 효과 & BGM 재생
  const handleAccept = (e) => {
    e.stopPropagation();
    if (transitionStep !== 'idle') return;

    // 모달 버튼에 갇힌 포커스 즉시 해제 (모바일 터치 스크롤 먹통 방지)
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.blur();
    }
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // 수락(Accept)을 클릭했을 때만 BGM 재생 이벤트 발생
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('play-wedding-bgm'));
    }

    // 1단계: 화면이 서서히 어두워짐 (800ms)
    setTransitionStep('darkening');

    // 2단계: 화면이 완전히 어두워진 시점(850ms) 후 본문 드러내기 시작
    setTimeout(() => {
      // 본문이 보이기 시작하기 직전에만 딱 1회 최상단(0, 0) 보정 및 스크롤 잠금 해제
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        window.focus();
      }
      setTransitionStep('revealing');

      // 3단계: 어둠이 안개처럼 걷힌 후 인트로 컴포넌트 언마운트 (항상 청첩장 최상단 보장)
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';
          window.scrollTo(0, 0);
        }
        // 부모 모달 컨테이너 스크롤도 최상단 리셋
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

  const groomName = invitation?.groom_name || '신랑';
  const brideName = invitation?.bride_name || '신부';

  return (
    <>
      {/* 1. 풀스크린 배경 사진 & 분리형 에어드랍 레이어 */}
      <div
        className={`fixed inset-0 z-50 flex flex-col justify-between items-center px-6 py-14 sm:py-16 select-none overflow-hidden ${
          transitionStep === 'revealing' 
            ? 'hidden pointer-events-none' 
            : transitionStep === 'darkening'
            ? 'opacity-100 pointer-events-none'
            : 'opacity-100'
        }`}
      >
        <style jsx>{`
          @keyframes shakeAnim {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-6px) rotate(-1deg); }
            40% { transform: translateX(6px) rotate(1deg); }
            60% { transform: translateX(-4px); }
            80% { transform: translateX(4px); }
          }
          .modal-shake {
            animation: shakeAnim 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
          }
        `}</style>

        {/* 풀스크린 배경 사진 */}
        <div className="absolute inset-0 -z-10 bg-stone-900">
          <img
            src={coverImage}
            alt="Wedding Cover"
            className="w-full h-full object-cover object-center pointer-events-none"
            onError={(e) => {
              if (e.currentTarget.src !== '/cover.jpg') {
                e.currentTarget.src = '/cover.jpg';
              }
            }}
          />
          {/* 밝은 사진에서도 흰색 창이 또렷하게 보이도록 하는 미세 딤드 */}
          <div className="absolute inset-0 bg-black/15 pointer-events-none" />
        </div>

        {/* 상단: 에어드랍 알림창 */}
        <div
          className={`w-full max-w-[305px] bg-white/95 backdrop-blur-xl rounded-[24px] px-6 py-4.5 text-center shadow-2xl border border-white/40 transition-all duration-300 mt-2 sm:mt-6 ${
            isShaking ? 'modal-shake' : ''
          }`}
          style={{
            boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.35)',
          }}
        >
          <h2 className="text-[17.5px] font-bold text-stone-900 tracking-tight font-sans">
            AirDrop
          </h2>
          <p className="text-[13px] text-stone-700 mt-1 font-normal leading-snug tracking-tight font-sans">
            <strong className="font-semibold text-stone-900">{groomName} &amp; {brideName}</strong> would like to share
            <br />
            a photo.
          </p>
        </div>

        {/* 거절 시 나타나는 위트있는 토스트 알림 (화면 정중앙 플로팅) */}
        {declineMsg && (
          <div className="z-30 my-auto animate-bounce">
            <div className="bg-black/85 backdrop-blur-md text-white text-[12px] font-medium py-2 px-4 rounded-full shadow-2xl text-center">
              {declineMsg}
            </div>
          </div>
        )}

        {/* 하단: Decline / Accept 버튼창 */}
        <div
          className={`w-full max-w-[305px] bg-white/95 backdrop-blur-xl rounded-[22px] overflow-hidden shadow-2xl border border-white/40 transition-all duration-300 mb-2 sm:mb-6 ${
            isShaking ? 'modal-shake' : ''
          }`}
          style={{
            boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.35)',
          }}
        >
          <div className="grid grid-cols-2 divide-x divide-stone-200/80">
            <button
              type="button"
              onClick={handleDecline}
              className="py-3.5 text-[15.5px] font-medium text-[#007AFF] hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer select-none font-sans text-center"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={handleAccept}
              className="py-3.5 text-[15.5px] font-bold text-[#007AFF] hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer select-none font-sans text-center"
            >
              Accept
            </button>
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
