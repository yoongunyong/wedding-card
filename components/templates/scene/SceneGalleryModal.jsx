'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export default function SceneGalleryModal({ isOpen, images = [], initialIndex = 0, onClose }) {
  const [rendered, setRendered] = useState(isOpen);
  const [active, setActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isSwiping = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setRendered(true);
      const raf = requestAnimationFrame(() => {
        setActive(true);
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setActive(false);
      const timer = setTimeout(() => {
        setRendered(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

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

  const handleClose = () => {
    setActive(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, prevImage, nextImage]);

  if (!rendered) return null;
  if (!images || images.length === 0) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/95 select-none p-4 transition-opacity duration-300 ease-out ${
        active ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleClose}
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
          type="button"
          onClick={handleClose}
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
          key={currentIndex}
          src={images[currentIndex]}
          alt={`Gallery ${currentIndex + 1}`}
          className={`max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl transition-all duration-300 select-none pointer-events-none ${
            active ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        />

        {/* 이전 버튼 */}
        {images.length > 1 && (
          <button
            type="button"
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
            type="button"
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs active:scale-90"
            aria-label="다음 사진"
          >
            ›
          </button>
        )}
      </div>

      {/* 하단 썸네일 스트립 */}
      {images.length > 1 && (
        <div 
          className="w-full max-w-[430px] overflow-x-auto py-3 px-2 flex items-center justify-center gap-2 z-10 shrink-0 no-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`w-10 h-10 rounded-md overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                currentIndex === idx
                  ? 'border-white opacity-100 scale-105'
                  : 'border-transparent opacity-40 hover:opacity-70'
              }`}
            >
              <img src={img} alt="thumb" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
