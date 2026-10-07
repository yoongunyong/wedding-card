'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export default function GalleryModal({ images = [], initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const prevImage = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextImage(); // 스와이프 왼쪽 -> 다음 사진
      } else {
        prevImage(); // 스와이프 오른쪽 -> 이전 사진
      }
    }
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
          className="absolute -top-10 right-2 text-white/80 hover:text-white text-2xl font-light p-2 z-10 transition-colors"
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

          {/* 좌우 내비게이션 버튼 (PC 및 버튼 조작용) */}
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-sm transition-all"
            aria-label="이전 사진"
          >
            ‹
          </button>
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-sm transition-all"
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
              onClick={() => setCurrentIndex(idx)}
              className={`rounded-full transition-all duration-300 ${
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
