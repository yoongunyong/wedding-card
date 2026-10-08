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
        className="relative w-full max-w-[420px] max-h-[85vh] flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-2 text-white/80 hover:text-white text-2xl font-light p-2 z-10 transition-colors cursor-pointer"
          aria-label="닫기"
        >
          ✕
        </button>

        {/* 메인 이미지 */}
        <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl flex items-center justify-center bg-stone-900 min-h-[350px]">
          <img
            src={images[currentIndex]}
            alt={`Wedding photo ${currentIndex + 1}`}
            className="w-full max-h-[75vh] object-contain transition-all duration-300"
          />

          {/* 좌우 내비게이션 버튼 (터치 이벤트 전파 방지로 2장 넘어감 방지) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 active:bg-black/80 text-white flex items-center justify-center text-lg transition-all cursor-pointer z-20"
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
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 active:bg-black/80 text-white flex items-center justify-center text-lg transition-all cursor-pointer z-20"
            aria-label="다음 사진"
          >
            ›
          </button>
        </div>

        {/* 하단 인디케이터 도트 */}
        <div className="flex items-center justify-center gap-2 mt-4 max-w-full overflow-x-auto py-1">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex
                  ? 'w-2.5 h-2.5 bg-white scale-110'
                  : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`${idx + 1}번째 사진 보기`}
            />
          ))}
        </div>

        {/* 카운터 표시 */}
        <p className="text-white/60 text-xs mt-1 font-sans">
          {currentIndex + 1} / {images.length}
        </p>

      </div>
    </div>
  );
}
