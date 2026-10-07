'use client';

import { useState, useEffect } from 'react';

export default function EnvelopeIntro({ invitation, onOpen }) {
  const [opened, setOpened] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // 날짜 포맷 (예: 2027.03.27 SAT)
  const dateStr = invitation?.wedding_date 
    ? invitation.wedding_date.slice(0, 10).replace(/-/g, '.')
    : '2027.03.27';

  const groomNameEn = invitation?.groom_name_en || 'Ki-deuk';
  const brideNameEn = invitation?.bride_name_en || 'Min-ki';

  useEffect(() => {
    // 인트로 표시 중 배경 스크롤 방지 & 최상단 고정
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      window.scrollTo(0, 0);
      document.body.style.overflow = 'hidden';
    }

    // 1.5초 후 클릭 힌트 표시
    const timer = setTimeout(() => setShowHint(true), 1500);
    return () => {
      clearTimeout(timer);
      if (typeof window !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, []);

  const handleClick = () => {
    if (opened) return;
    setOpened(true);
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
        document.body.style.overflow = '';
      }
      if (onOpen) onOpen();
    }, 800); // 800ms 페이드아웃 애니메이션 후 전환
  };

  return (
    <div
      onClick={handleClick}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B0908] cursor-pointer select-none transition-all duration-700 ${
        opened ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      <style jsx>{`
        @keyframes letterSlideUp {
          0% {
            transform: translateY(40px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes textFadeIn {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .anim-slide-up {
          animation: letterSlideUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-text-1 {
          animation: textFadeIn 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both;
        }
        .anim-text-2 {
          animation: textFadeIn 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.7s both;
        }
        .anim-text-3 {
          animation: textFadeIn 0.9s cubic-bezier(0.16, 1, 0.3, 1) 1.0s both;
        }
        .anim-seal {
          animation: textFadeIn 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
        }
      `}</style>

      {/* 봉투 컨테이너 */}
      <div className="relative w-[320px] sm:w-[350px] flex flex-col items-center">
        
        {/* 상단 열린 플랩 배경 */}
        <div 
          className="w-[280px] h-[70px] bg-[#EBE4D8] rounded-t-lg shadow-inner"
          style={{
            clipPath: 'polygon(0% 100%, 50% 0%, 100% 100%)',
            filter: 'drop-shadow(0 -4px 6px rgba(0,0,0,0.15))'
          }}
        />

        {/* 편지지 카드 (봉투 안에서 위로 올라온 형태) */}
        <div className="anim-slide-up relative -mt-12 z-10 w-[240px] bg-[#FCFBF7] rounded-t-sm shadow-xl px-5 py-7 text-center border border-[#ECE5D8]">
          <p className="anim-text-1 font-serif italic text-2xl text-[#2C2725] tracking-wide leading-tight">
            Welcome to
          </p>
          <p className="anim-text-2 font-serif italic text-2xl text-[#2C2725] tracking-wide leading-tight mb-3">
            our wedding
          </p>
          <div className="anim-text-3 inline-block border-t border-[#D9D0C3] pt-2 px-3">
            <p className="font-serif text-[11px] text-[#7A736E] tracking-[0.2em] uppercase">
              {dateStr} SAT
            </p>
          </div>
        </div>

        {/* 봉투 본체 (하단 포켓) */}
        <div className="relative -mt-6 z-20 w-[290px] h-[190px] bg-[#EFE9DE] rounded-b-lg shadow-2xl flex flex-col items-center justify-between p-4 border-t border-[#E3DC CE]">
          
          {/* 봉투 전면 삼각 라인 음영 효과 */}
          <div 
            className="absolute inset-0 bg-[#E8E1D3]/50 pointer-events-none rounded-b-lg"
            style={{
              clipPath: 'polygon(0% 0%, 50% 45%, 100% 0%, 100% 100%, 0% 100%)'
            }}
          />

          {/* 중앙 실링 왁스 스탬프 */}
          <div className="anim-seal relative z-30 -mt-7 flex items-center justify-center">
            <div className="w-13 h-13 rounded-full bg-[#821D24] shadow-lg flex items-center justify-center border-2 border-[#6D141A] transform active:scale-95 transition-transform">
              {/* 장미 엠보싱 인장 */}
              <svg 
                className="w-7 h-7 text-[#E5A8A8] opacity-90 drop-shadow" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M12 2C9.5 2 7.5 3.5 7.5 5.5C7.5 6.3 7.8 7 8.4 7.6C7.3 8.3 6.5 9.5 6.5 11C6.5 12.3 7.1 13.5 8 14.2C7.4 15 7 16 7 17C7 19.8 9.2 22 12 22C14.8 22 17 19.8 17 17C17 16 16.6 15 16 14.2C16.9 13.5 17.5 12.3 17.5 11C17.5 9.5 16.7 8.3 15.6 7.6C16.2 7 16.5 6.3 16.5 5.5C16.5 3.5 14.5 2 12 2ZM12 4C13.4 4 14.5 4.9 14.5 5.5C14.5 6.1 13.4 7 12 7C10.6 7 9.5 6.1 9.5 5.5C9.5 4.9 10.6 4 12 4Z" />
              </svg>
            </div>
          </div>

          {/* 하단 영문 필기체 이름 표기 */}
          <div className="relative z-30 text-center w-full mt-auto mb-2">
            <p className="font-serif italic text-[15px] text-[#4A433E] tracking-wider font-light">
              From {brideNameEn} &amp; {groomNameEn}
            </p>
          </div>
        </div>

      </div>

      {/* 화면 클릭 힌트 */}
      <div 
        className={`mt-10 text-center transition-opacity duration-700 ${
          showHint ? 'opacity-70' : 'opacity-0'
        }`}
      >
        <p className="text-stone-400 text-xs tracking-widest animate-pulse font-light">
          화면을 터치해주세요
        </p>
      </div>

    </div>
  );
}
