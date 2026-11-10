'use client';

import { useState, useEffect } from 'react';

export default function QuickNavigationPill({
  hasLocation = true,
  hasAccounts = true,
  className = '',
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 스크롤 감지: 사용자가 첫 화면에서 조금이라도 스크롤(120px 이상)하면 자연스럽게 노출
  useEffect(() => {
    // 1. 일반 웹페이지 윈도우 스크롤 감지
    const handleWindowScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setIsVisible(scrollY > 120);
    };

    // 2. 모달 내부 스크롤 감지 (제작/수정 화면 미리보기 지원)
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

    // 초기 상태 확인
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
      // 미리보기 모달 내부인 경우
      const containerTop = previewContainer.getBoundingClientRect().top;
      const targetTop = el.getBoundingClientRect().top;
      const relativeTop = targetTop - containerTop + previewContainer.scrollTop;
      previewContainer.scrollTo({
        top: Math.max(0, relativeTop - 20),
        behavior: 'smooth',
      });
    } else if (el) {
      // 일반 전체 화면 브라우저인 경우
      const yOffset = -24;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
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
  if (!hasLocation && !hasAccounts) return null;

  return (
    <aside 
      aria-label="어르신 및 하객용 퀵 내비게이션"
      className={`fixed bottom-5 right-4 z-40 transition-all duration-300 ease-out select-none print:hidden ${className}`}
    >
      {isCollapsed ? (
        // 최소화된 상태: 작은 원형 퀵 바로가기 버튼
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="flex items-center justify-center w-11 h-11 bg-stone-900/90 hover:bg-black text-amber-300 hover:text-white rounded-full shadow-[0_8px_25px_rgba(0,0,0,0.35)] backdrop-blur-md border border-stone-700/80 cursor-pointer transition-transform hover:scale-110 active:scale-95 group"
          title="식장 위치 / 계좌 퀵 메뉴 열기"
          aria-label="식장 위치 및 계좌 퀵 메뉴 열기"
        >
          <span className="text-base group-hover:rotate-12 transition-transform">📍</span>
        </button>
      ) : (
        // 펼쳐진 상태: 어르신 친화적인 정갈한 알약(Pill) 바
        <div className="flex items-center gap-1.5 p-1.5 bg-stone-900/92 backdrop-blur-md rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.4)] border border-stone-700/70 text-white animate-in fade-in slide-in-from-bottom-2 duration-200">
          {hasLocation && (
            <button
              type="button"
              onClick={() => scrollToTarget('location-section')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium bg-stone-800/90 hover:bg-stone-700 text-stone-100 hover:text-white transition-all cursor-pointer active:scale-95"
            >
              <span>📍</span>
              <span>오시는 길</span>
            </button>
          )}

          {hasAccounts && (
            <button
              type="button"
              onClick={() => scrollToTarget('accounts-section')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium bg-stone-800/90 hover:bg-stone-700 text-stone-100 hover:text-white transition-all cursor-pointer active:scale-95"
            >
              <span>💌</span>
              <span>축의금 계좌</span>
            </button>
          )}

          <div className="w-[1px] h-3.5 bg-stone-700/80 my-auto" />

          {/* 맨 위로 스크롤 버튼 */}
          <button
            type="button"
            onClick={scrollToTop}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-800 text-stone-300 hover:text-white transition-colors cursor-pointer text-xs"
            title="맨 위로"
            aria-label="페이지 맨 위로 이동"
          >
            ▲
          </button>

          {/* 접기(최소화) 버튼 */}
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer text-[11px]"
            title="퀵 메뉴 접기"
            aria-label="퀵 메뉴 접기"
          >
            ✕
          </button>
        </div>
      )}
    </aside>
  );
}
