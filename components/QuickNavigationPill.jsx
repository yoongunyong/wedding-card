'use client';

import { useState, useEffect } from 'react';
import { getSafeKakaoShareImageUrl } from '@/lib/kakaoShare';

export default function QuickNavigationPill({
  hasLocation = true,
  hasAccounts = true,
  hasShare = true,
  invitation = null,
  className = '',
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

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

  // 모달 오픈 시 배경 스크롤 락
  useEffect(() => {
    if (showShareModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showShareModal]);

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
    } else if (el) {
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

  // 링크 복사
  const handleCopyLink = async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    } catch {
      alert('링크 복사에 실패했습니다.');
    }
  };

  // 카카오톡 공유
  const handleKakaoShare = () => {
    if (typeof window === 'undefined') return;

    const currentUrl = window.location.href;
    const groom = invitation?.groom_name || '';
    const bride = invitation?.bride_name || '';
    const coupleText = [groom, bride].filter(Boolean).join(' ♥ ');
    const shareTitle = coupleText ? `${coupleText} 결혼식에 초대합니다` : '소중한 결혼식에 초대합니다';

    const dateStr = invitation?.wedding_date || '';
    const venueStr = [invitation?.venue_name, invitation?.venue_hall].filter(Boolean).join(' ');
    const shareDesc = [dateStr ? `${dateStr.replace('T', ' ')}` : '', venueStr].filter(Boolean).join(' | ') || '청첩장을 확인해 보세요';

    const mainImg = invitation?.images?.cover || invitation?.images?.main || invitation?.main_image || '';
    const shareImageUrl = getSafeKakaoShareImageUrl(mainImg, invitation?.template_type || 'basic');

    if (window.Kakao && window.Kakao.isInitialized && window.Kakao.isInitialized()) {
      try {
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: shareTitle,
            description: shareDesc,
            imageUrl: shareImageUrl,
            imageWidth: 800,
            imageHeight: 1000,
            link: {
              mobileWebUrl: currentUrl,
              webUrl: currentUrl,
            },
          },
          buttons: [
            {
              title: '모바일 청첩장 보기',
              link: {
                mobileWebUrl: currentUrl,
                webUrl: currentUrl,
              },
            },
          ],
        });
        setShowShareModal(false);
        return;
      } catch (err) {
        console.warn('카카오톡 공유 실패, fallback to copy:', err);
      }
    }

    handleCopyLink();
    alert('카카오톡 연결을 준비하는 중입니다. 청첩장 링크가 복사되었습니다!');
  };

  // 모바일 시스템 네이티브 공유 API (지원 기기)
  const handleNativeShare = async () => {
    if (typeof window === 'undefined') return;
    const groom = invitation?.groom_name || '';
    const bride = invitation?.bride_name || '';
    const coupleText = [groom, bride].filter(Boolean).join(' ♥ ');
    const title = coupleText ? `${coupleText} 결혼식에 초대합니다` : '모바일 청첩장';

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: title,
          url: window.location.href,
        });
        setShowShareModal(false);
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  if (!isVisible && !showShareModal) return null;
  if (!hasLocation && !hasAccounts && !hasShare && !showShareModal) return null;

  const groom = invitation?.groom_name || '';
  const bride = invitation?.bride_name || '';
  const coupleText = [groom, bride].filter(Boolean).join(' ♥ ');

  return (
    <>
      {isVisible && (
        <aside 
          aria-label="어르신 및 하객용 퀵 내비게이션"
          className={`fixed bottom-5 right-3.5 sm:right-[max(1rem,calc(50vw-215px+1rem))] z-40 transition-all duration-300 ease-out select-none print:hidden ${className}`}
        >
          {isCollapsed ? (
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
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-sans font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100/70 transition-all cursor-pointer active:scale-95 group"
                  title="청첩장 공유하기 팝업 열기"
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
      )}

      {/* 공유하기 바텀시트 / 팝업 모달 (방안 1: 화면 이동 없이 띄움) */}
      {showShareModal && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 select-none"
          onClick={() => setShowShareModal(false)}
        >
          <div 
            className="bg-[#FEFEFE] w-full max-w-[340px] rounded-[24px] shadow-2xl p-6 text-center relative animate-in zoom-in-95 duration-200 border border-stone-200/80"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 상단 닫기 X 버튼 */}
            <button
              type="button"
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 transition-colors p-1 cursor-pointer"
              aria-label="닫기"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* 상단 타이포그래피 */}
            <span className="font-mono text-[10px] text-stone-400 tracking-[0.2em] uppercase block mb-1">
              SHARE INVITATION
            </span>
            <h3 className="font-sans font-bold text-[17px] text-stone-800 tracking-tight">
              소중한 분들께 초대장을 전해보세요
            </h3>
            {coupleText && (
              <p className="font-sans text-[13px] text-stone-500 mt-1">
                {coupleText}
              </p>
            )}

            {/* 구분선 */}
            <div className="w-12 h-px bg-stone-200 mx-auto my-4" />

            {/* 공유 버튼 목록 */}
            <div className="space-y-2.5">
              {/* 1. 카카오톡 공유하기 */}
              <button
                type="button"
                onClick={handleKakaoShare}
                className="w-full py-3.5 px-4 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] text-[13px] font-sans font-semibold rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.708 4.8 4.27 6.054-.187.698-.675 2.528-.773 2.915-.121.482.177.476.372.346.154-.102 2.45-1.666 3.442-2.344.56.082 1.127.129 1.689.129 4.97 0 9-3.185 9-7.115S16.97 3 12 3z" />
                </svg>
                <span>카카오톡으로 공유하기</span>
              </button>

              {/* 2. 링크 복사 */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-3.5 px-4 bg-white hover:bg-stone-50 text-stone-700 text-[13px] font-sans font-medium rounded-full border border-stone-200/90 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
              >
                <svg className="w-4 h-4 text-stone-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>{copiedToast ? '청첩장 주소가 복사되었습니다! ✨' : '청첩장 링크 복사하기'}</span>
              </button>

              {/* 3. 모바일 기기 시스템 공유 (지원 시) */}
              {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full py-2.5 px-4 text-stone-500 hover:text-stone-800 text-[12px] font-sans rounded-full flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  <span>기타 앱으로 공유 (문자/인스타그램 등)</span>
                </button>
              )}
            </div>

            {/* 안내 문구 */}
            <p className="mt-5 text-[11px] text-stone-400 font-sans tracking-tight">
              DESIGNED BY ATELIER DE MUKIRU
            </p>
          </div>
        </div>
      )}
    </>
  );
}
