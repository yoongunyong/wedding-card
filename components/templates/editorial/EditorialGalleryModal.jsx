'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export default function EditorialGalleryModal({ images = [], initialIndex = 0, onClose }) {
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
        nextImage();
      } else {
        prevImage();
      }
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

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
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md select-none p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[420px] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 상단 헤더: 에디토리얼 카운터 & 닫기 */}
        <div className="w-full flex items-center justify-between pb-3 px-1 text-white">
          <span className="font-sans text-[12px] tracking-[0.25em] text-white/70 font-light">
            PAGE {String(currentIndex + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
          </span>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-2xl p-1 transition-colors cursor-pointer leading-none font-light"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 메인 화보 프레임 */}
        <div className="relative w-full h-[64vh] max-h-[580px] min-h-[380px] overflow-hidden bg-black/50 border border-white/10 flex items-center justify-center p-2 shadow-2xl">
          <img
            key={currentIndex}
            src={images[currentIndex]}
            alt={`Lookbook photo ${currentIndex + 1}`}
            className="w-full h-full object-contain animate-in fade-in duration-300 select-none"
          />

          {/* 좌우 내비게이션 화살표 */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 border border-white/20 bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-all cursor-pointer"
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
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 border border-white/20 bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-all cursor-pointer"
            aria-label="다음 사진"
          >
            ›
          </button>
        </div>

        {/* 하단 썸네일 스트립 */}
        <div className="w-full flex items-center justify-center gap-1.5 pt-3 overflow-x-auto">
          {images.map((src, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`w-8 h-10 overflow-hidden border transition-all cursor-pointer shrink-0 ${
                idx === currentIndex
                  ? 'border-white opacity-100 scale-105'
                  : 'border-white/20 opacity-40 hover:opacity-80'
              }`}
            >
              <img src={src} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
