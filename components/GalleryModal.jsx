'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export default function GalleryModal({ images = [], initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const isSwiping = useRef(false);

  const prevImage = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const handleTouchStart = (e) => {
    isSwiping.current = true;
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!isSwiping.current) return;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) return;
    isSwiping.current = false;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextImage(); // 스와이프 왼쪽 -> 다음 사진
      } else {
        prevImage(); // 스와이프 오른쪽 -> 이전 사진
      }
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // 키보드 좌우 화살표 & ESC 키 지원
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, prevImage, nextImage]);

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm select-none p-4"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-[420px] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 상단 헤더: 카운터 & 닫기 버튼 */}
        <div className="w-full flex items-center justify-between pb-3 px-1 text-white">
          <span className="text-xs font-sans text-white/70 tracking-wider font-medium">
            {currentIndex + 1} / {images.length}
          </span>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-xl p-1 transition-colors cursor-pointer leading-none"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 메인 이미지 고정 프레임: 사진 비율과 상관없이 박스 크기 완전 고정 */}
        <div className="relative w-full h-[62vh] max-h-[560px] min-h-[380px] overflow-hidden rounded-2xl shadow-2xl flex items-center justify-center bg-stone-950 border border-white/5">
          <img
            key={currentIndex}
            src={images[currentIndex]}
            alt={`Wedding photo ${currentIndex + 1}`}
            className="w-full h-full object-contain animate-in fade-in duration-200 select-none"
          />

          {/* 좌우 내비게이션 버튼 (프레임 정중앙에 완전 고정) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/45 hover:bg-black/70 active:bg-black/90 text-white flex items-center justify-center text-xl transition-all cursor-pointer z-20 backdrop-blur-xs shadow-md"
            aria-label="이전 사진"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/45 hover:bg-black/70 active:bg-black/90 text-white flex items-center justify-center text-xl transition-all cursor-pointer z-20 backdrop-blur-xs shadow-md"
            aria-label="다음 사진"
          >
            ›
          </button>
        </div>

        {/* 하단 인디케이터 도트 */}
        <div className="flex items-center justify-center gap-1.5 mt-4 max-w-full overflow-x-auto py-1 px-2">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`rounded-full transition-all duration-300 cursor-pointer shrink-0 ${
                idx === currentIndex
                  ? 'w-2.5 h-2.5 bg-white scale-110 shadow-xs'
                  : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`${idx + 1}번째 사진 보기`}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
