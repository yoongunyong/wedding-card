'use client';

import { useState, useEffect } from 'react';

export default function QuickNavigationPill({
  hasLocation = true,
  hasAccounts = true,
  hasShare = true,
  className = '',
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 스크롤 감지: 사용자가 첫 화면에서 120px 이상 스크롤하면 부드럽게 노출
  useEffect(() => {
    const handleWindowScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setIsVisible(scrollY > 120);
    };

    const previewContainer = document.getElementById('preview-scroll-container');
    const handleContainerScroll = () => {
      if (previewContainer) {
        setIsVisible(previewContainer.scrollTop > 80);
      }
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    if (previewContainer) {
      previewContainer.addEventListener('scroll', handleContainerScroll, { passive: true });
    }

    handleWindowScroll();
    if (previewContainer) handleContainerScroll();

    return () => {
      window.removeEventListener('scroll', handleWindowScroll);
      if (previewContainer) {
        previewContainer.removeEventListener('scroll', handleContainerScroll);
      }
    };
  }, []);

  const scrollToTarget = (targetId) => {
    const previewContainer = document.getElementById('preview-scroll-container');
    const el = document.getElementById(targetId);

    if (previewContainer && el) {
      const containerTop = previewContainer.getBoundingClientRect().top;
      const targetTop = el.getBoundingClientRect().top;
      const relativeTop = targetTop - containerTop + previewContainer.scrollTop;
      previewContainer.scrollTo({
        top: Math.max(0, relativeTop - 20),
        behavior: 'smooth',
      });
    } else if (previewContainer && targetId === 'share-section') {
      previewContainer.scrollTo({
        top: previewContainer.scrollHeight,
        behavior: 'smooth',
      });
    } else if (el) {
      const yOffset = -24;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    } else if (targetId === 'share-section') {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  const scrollToTop = () => {
    const previewContainer = document.getElementById('preview-scroll-container');
    if (previewContainer) {
      previewContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!isVisible) return null;
  if (!hasLocation && !hasAccounts && !hasShare) return null;

  return (
    <aside 
      aria-label="어르신 및 하객용 퀵 내비게이션"
      className={`fixed bottom-5 right-3.5 sm:right-[max(1rem,calc(50vw-215px+1rem))] z-40 transition-all duration-300 ease-out select-none print:hidden ${className}`}
    >
      {isCollapsed ? (
        // 최소화된 상태: 우아하고 은은한 투명 글래스 원형 버튼
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="flex items-center justify-center w-9 h-9 bg-white/85 hover:bg-white text-stone-500 hover:text-stone-800 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.06)] backdrop-blur-md border border-stone-200/70 cursor-pointer transition-all hover:scale-105 active:scale-95 group"
          title="퀵 내비게이션 열기 (위치 · 계좌 · 공유)"
          aria-label="식장 위치, 계좌 및 공유 퀵 메뉴 열기"
        >
          <svg className="w-4 h-4 text-stone-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      ) : (
        // 펼쳐진 상태: 맑고 투명한 소프트 화이트 글래스 알약 (Frosted White Glass Pill)
        <div className="flex items-center gap-0.5 p-1 bg-white/85 backdrop-blur-md rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-stone-200/70 text-stone-600 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {hasLocation && (
            <button
              type="button"
              onClick={() => scrollToTarget('location-section')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-sans font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100/70 transition-all cursor-pointer active:scale-95 group"
            >
              <svg className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>오시는 길</span>
            </button>
          )}

          {hasAccounts && (
            <button
              type="button"
              onClick={() => scrollToTarget('accounts-section')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-sans font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100/70 transition-all cursor-pointer active:scale-95 group"
            >
              <svg className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>마음 전하기</span>
            </button>
          )}

          {hasShare && (
            <button
              type="button"
              onClick={() => scrollToTarget('share-section')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-sans font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100/70 transition-all cursor-pointer active:scale-95 group"
              title="하단 공유하기 영역으로 바로 이동"
            >
              <svg className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-600 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>공유하기</span>
            </button>
          )}

          <div className="w-[1px] h-3 bg-stone-200/80 my-auto mx-0.5" />

          {/* 맨 위로 스크롤 버튼 */}
          <button
            type="button"
            onClick={scrollToTop}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
            title="맨 위로"
            aria-label="페이지 맨 위로 이동"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
            </svg>
          </button>

          {/* 접기(최소화) 버튼 */}
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
            title="접기"
            aria-label="접기"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </aside>
  );
}
