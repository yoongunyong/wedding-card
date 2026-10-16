'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export default function SceneGalleryModal({ images = [], initialIndex = 0, onClose }) {
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
    if (Math.abs(diff) > 40) {
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

  if (!images || images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/95 select-none p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* 상단 인디케이터 & 닫기 */}
      <div 
        className="w-full max-w-[430px] flex items-center justify-between text-white/90 pt-3 px-2 z-10 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="font-mono text-sm tracking-widest text-stone-300 font-light">
          {currentIndex + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg font-light transition-colors cursor-pointer"
          aria-label="닫기"
        >
          ✕
        </button>
      </div>

      {/* 중앙 메인 이미지 뷰어 */}
      <div
        className="relative w-full max-w-[430px] flex-1 flex items-center justify-center my-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={images[currentIndex]}
          alt={`Gallery ${currentIndex + 1}`}
          className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl transition-all duration-300 select-none pointer-events-none"
        />

        {/* 이전 버튼 */}
        {images.length > 1 && (
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs active:scale-90"
            aria-label="이전 사진"
          >
            ‹
          </button>
        )}

        {/* 다음 버튼 */}
        {images.length > 1 && (
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs active:scale-90"
            aria-label="다음 사진"
          >
            ›
          </button>
        )}
      </div>

      {/* 하단 썸네일 바 */}
      <div 
        className="w-full max-w-[430px] pb-4 px-2 z-10 overflow-x-auto no-scrollbar shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center gap-1.5 py-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-9 h-9 rounded-md overflow-hidden shrink-0 border transition-all ${
                currentIndex === idx 
                  ? 'border-white scale-110 opacity-100 shadow-md' 
                  : 'border-transparent opacity-40 hover:opacity-75'
              }`}
            >
              <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
