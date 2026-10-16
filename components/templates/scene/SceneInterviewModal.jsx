'use client';

import { useEffect } from 'react';

export default function SceneInterviewModal({ isOpen, onClose, groomName, brideName, interviews = [] }) {
  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 제목 생성 (영상 속 '세희와 지호의 이야기' 스타일)
  const coupleTitle = [groomName, brideName].filter(Boolean).join('와 ') + '의 이야기';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-[420px] rounded-2xl p-6 sm:p-7 shadow-2xl relative max-h-[85vh] flex flex-col border border-stone-200 animate-in zoom-in-95 duration-200 text-[#222222]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 상단 헤더 (가운데 정렬 + 우측 닫기 버튼) */}
        <div className="relative pb-4 border-b border-stone-100 shrink-0 text-center">
          <h3 className="font-serif text-base sm:text-lg font-medium text-stone-900 tracking-tight">
            {coupleTitle || '우리의 이야기'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-0 top-0 w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-900 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 인터뷰 문답 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1">
          {interviews && interviews.length > 0 ? (
            interviews.map((item, idx) => (
              <div 
                key={item.id || idx} 
                className="p-5 bg-[#F9F9F9] rounded-xl border border-stone-100 space-y-3"
              >
                {/* 질문 */}
                <h4 className="font-serif text-sm sm:text-[14.5px] font-bold text-stone-900 leading-snug">
                  Q{idx + 1}. {item.question}
                </h4>

                {/* 개별 응답 (신랑 / 신부) 또는 통합 응답 */}
                {item.groom_answer || item.bride_answer ? (
                  <div className="space-y-2.5 pt-1">
                    {item.groom_answer && (
                      <div className="p-3 bg-white rounded-lg border border-stone-200/70 shadow-2xs">
                        <div className="flex items-center gap-1.5 mb-1 text-stone-900 font-semibold text-xs">
                          <span>🤵</span>
                          <span>{item.groom_label || `신랑 ${groomName}`}</span>
                        </div>
                        <p className="text-xs text-stone-600 leading-relaxed font-light whitespace-pre-line break-keep">
                          {item.groom_answer}
                        </p>
                      </div>
                    )}

                    {item.bride_answer && (
                      <div className="p-3 bg-white rounded-lg border border-stone-200/70 shadow-2xs">
                        <div className="flex items-center gap-1.5 mb-1 text-stone-900 font-semibold text-xs">
                          <span>👰</span>
                          <span>{item.bride_label || `신부 ${brideName}`}</span>
                        </div>
                        <p className="text-xs text-stone-600 leading-relaxed font-light whitespace-pre-line break-keep">
                          {item.bride_answer}
                        </p>
                      </div>
                    )}
                  </div>
                ) : item.answer ? (
                  <div className="p-3 bg-white rounded-lg border border-stone-200/70 shadow-2xs">
                    <p className="text-xs text-stone-600 leading-relaxed font-light whitespace-pre-line break-keep">
                      {item.answer}
                    </p>
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-xs text-stone-400">
              아직 등록된 인터뷰 내용이 없습니다.
            </div>
          )}
        </div>

        {/* 하단 닫기 버튼 */}
        <div className="pt-3 border-t border-stone-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-stone-900 hover:bg-black text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
