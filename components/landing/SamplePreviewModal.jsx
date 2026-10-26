'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function SamplePreviewModal({ isOpen, template, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-4">
      {/* 바깥 배경 클릭 영역 */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* 모달 윈도우 */}
      <div className="relative w-full sm:max-w-[430px] h-full sm:h-[90vh] sm:max-h-[880px] bg-white sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 border border-stone-200/50">
        {/* 상단 헤더 바 */}
        <div className="h-14 px-4 bg-stone-900 text-white flex items-center justify-between shrink-0 border-b border-stone-800">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs text-stone-300 hover:text-white transition-colors py-2 px-1"
          >
            <span className="text-base leading-none">←</span>
            <span className="font-medium">샘플 미리보기</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-stone-400 hidden xs:inline">
              {template.title}
            </span>
            <Link
              href={`/create?template=${template.id}`}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-full shadow-sm transition-all active:scale-95 flex items-center gap-1"
            >
              <span>이 샘플로 제작하기</span>
              <span className="text-sm">➔</span>
            </Link>
          </div>
        </div>

        {/* 모바일 청첩장 iframe 실시간 렌더링 뷰어 */}
        <div className="flex-1 w-full bg-stone-100 relative overflow-hidden">
          <iframe
            src={`/${template.id}`}
            title={`${template.title} 미리보기`}
            className="w-full h-full border-0 bg-white"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
