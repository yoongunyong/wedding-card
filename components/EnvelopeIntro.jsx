'use client';

import { useState, useEffect } from 'react';

export default function EnvelopeIntro({ invitation, onOpen }) {
  // 'idle' | 'darkening' | 'revealing'
  const [transitionStep, setTransitionStep] = useState('idle');
  const [isShaking, setIsShaking] = useState(false);
  const [declineMsg, setDeclineMsg] = useState('');

  // Supabase 컬럼 cover_image 최우선 매핑
  const coverImage =
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
    }

    return () => {
      if (typeof window !== 'undefined') {
        document.body.style.overflow = '';
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

  // Accept 클릭 시 깊고 서정적인 시네마틱 전환 효과
  const handleAccept = (e) => {
    e.stopPropagation();
    if (transitionStep !== 'idle') return;

    // 1단계: 화면이 매우 천천히, 서서히 어두워짐 (850ms)
    setTransitionStep('darkening');

    // 2단계: 화면이 완전히 어두워진 시점(850ms) + 150ms 정적 후 본문 드러내기 시작
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
      }
      setTransitionStep('revealing');

      // 3단계: 1800ms(약 1.8초) 동안 어둠이 안개처럼 아주 천천히 걷히며 본문이 감성적으로 피어남
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.scrollTo(0, 0);
          document.body.style.overflow = '';
        }
        if (onOpen) onOpen();
      }, 1850);
    }, 1000);
  };

  return (
    <>
      {/* 1. 인트로 카드 팝업 레이어 (암전이 완료될 때까지 불투명 유지 -> 본문 비침 원천 차단) */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 select-none ${
          transitionStep === 'revealing' ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={{
          backgroundColor: '#FFFFFF',
        }}
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

        {/* 시안 1:1 맞춤 모달 카드 (상하단 연회색빛, 중앙 풀위드 사진) */}
        <div
          className={`relative w-[84%] max-w-[285px] bg-[#ECEEF0] rounded-[26px] overflow-hidden flex flex-col transition-all duration-300 ${
            isShaking ? 'modal-shake' : ''
          }`}
          style={{
            boxShadow: '0 12px 35px -8px rgba(0, 0, 0, 0.12), 0 0 1px 1px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* 상단 텍스트 영역 (약간의 회색빛 배경) */}
          <div className="pt-6 pb-4 px-4 text-center bg-[#ECEEF0]">
            <h2 className="text-[18.5px] font-bold text-[#1A1A1A] tracking-tight flex items-center justify-center gap-1.5 font-sans">
              Wedding Day <span className="text-[17px] leading-none inline-block">💌</span>
            </h2>
            <p className="text-[12.5px] text-[#555555] mt-1 font-normal tracking-tight font-sans">
              Invitation
            </p>
          </div>

          {/* 중앙 커버 사진 영역: 상하단 회색 영역 사이에 좌우 꽉 차게 배치 */}
          <div className="relative w-full aspect-[4/4.2] overflow-hidden bg-stone-200 select-none">
            <img
              src={coverImage}
              alt="Wedding Day Invitation"
              className="w-full h-full object-cover object-center pointer-events-none"
              onError={(e) => {
                if (e.currentTarget.src !== '/cover.jpg') {
                  e.currentTarget.src = '/cover.jpg';
                }
              }}
            />

            {/* 거절 시 나타나는 위트있는 토스트 알림 */}
            {declineMsg && (
              <div className="absolute inset-x-2 bottom-3 z-20 flex justify-center animate-bounce">
                <div className="bg-black/85 backdrop-blur-md text-white text-[11.5px] font-medium py-1.5 px-3 rounded-full shadow-lg text-center leading-snug">
                  {declineMsg}
                </div>
              </div>
            )}
          </div>

          {/* 하단 2분할 버튼 영역 (상단과 동일한 연회색빛 배경 & 흰색 구분선) */}
          <div className="grid grid-cols-2 divide-x divide-white/80 border-t border-white/60 bg-[#ECEEF0]">
            {/* Decline 버튼 */}
            <button
              type="button"
              onClick={handleDecline}
              className="py-3.5 text-[15.5px] font-medium text-[#F472B6] hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer select-none font-sans text-center"
            >
              Decline
            </button>

            {/* Accept 버튼 */}
            <button
              type="button"
              onClick={handleAccept}
              className="py-3.5 text-[15.5px] font-bold text-[#E83E6E] hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer select-none font-sans text-center"
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
            ? 'opacity-100 duration-[850ms] ease-in-out'
            : transitionStep === 'revealing'
            ? 'opacity-0 duration-[1800ms] ease-[cubic-bezier(0.22,1,0.36,1)]'
            : 'opacity-0 duration-0'
        }`}
      />
    </>
  );
}
